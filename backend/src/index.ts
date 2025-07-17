import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '../src/generated/prisma';
import { body, param, validationResult } from 'express-validator';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Security middlewares
app.use(helmet());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 })); // 100 req/min per IP
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Placeholder for authentication middleware
const JWT_SECRET = 'supersecret'; // In production, use env var

// Simple JWT auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Demo login endpoint (hardcoded user)
app.post('/login', [body('username').isString(), body('password').isString()], handleValidationErrors, (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Hardcoded user: user/pass
  if (username === 'user' && password === 'pass') {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Helper: validation error handler
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Socket.IO event handlers
io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("new-task", (task: any) => {
    socket.broadcast.emit("receive-task", task);
  });

  socket.on("update-task", (updatedTask: any) => {
    socket.broadcast.emit("receive-updated-task", updatedTask);
  });

  socket.on("delete-task", (taskId: string) => {
    socket.broadcast.emit("delete-task", taskId);
  });

  socket.on("bulk-reorder", (data: any) => {
    socket.broadcast.emit("receive-bulk-reorder", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Health check / root
app.get("/", (_req, res) => {
  res.json({
    message: "TaskSync Backend is running",
    endpoints: {
      list:    "GET    /tasks",
      create:  "POST   /tasks",
      update:  "PUT    /tasks/:id",
      delete:  "DELETE /tasks/:id",
      reorder: "PUT    /tasks/reorder",
    }
  });
});

// GET /tasks
app.get("/tasks", async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [
        { status: 'asc' },
        { position: 'asc' }
      ]
    });
    res.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error.message ?? error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST /tasks
app.post(
  "/tasks",
  [
    body("id").isUUID().withMessage("id must be a valid UUID"),
    body("title").isString().trim().notEmpty().withMessage("title is required"),
    body("status").isIn(["todo", "inprogress", "done"]).withMessage("status is invalid"),
    body("position").optional().isInt(),
    body("createdAt").optional().isISO8601(),
    body("updatedAt").optional().isISO8601(),
  ],
  handleValidationErrors,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id, title, status, position, createdAt, updatedAt } = req.body;
      let taskPosition = position;
      if (taskPosition === undefined || taskPosition === null) {
        const maxPos = await prisma.task.findFirst({
          where: { status },
          orderBy: { position: 'desc' }
        });
        taskPosition = maxPos ? maxPos.position + 1 : 0;
      }
      const task = await prisma.task.create({
        data: {
          id,
          title,
          status,
          position: taskPosition,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        },
      });
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task:", error.message ?? error);
      res.status(500).json({ error: "Failed to create task" });
    }
  }
);

// PUT /tasks/:id
app.put(
  "/tasks/:id",
  [
    param("id").isUUID().withMessage("id must be a valid UUID"),
    body("title").optional().isString().trim().notEmpty(),
    body("status").optional().isIn(["todo", "inprogress", "done"]),
    body("position").optional().isInt(),
  ],
  handleValidationErrors,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, status, position } = req.body;
      const updateData: any = { updatedAt: new Date() };
      if (title !== undefined)    updateData.title    = title;
      if (status !== undefined)   updateData.status   = status;
      if (position !== undefined) updateData.position = position;
      const task = await prisma.task.update({
        where: { id },
        data: updateData,
      });
      res.json(task);
    } catch (error: any) {
      console.error("Error updating task:", error.message ?? error);
      if (error.code === 'P2025') {
        res.status(404).json({ error: "Task not found" });
      } else {
        res.status(500).json({ error: "Failed to update task" });
      }
    }
  }
);

// PUT /tasks/reorder
app.put(
  "/tasks/reorder",
  [
    body("taskIds").isArray({ min: 1 }).withMessage("taskIds must be a non-empty array"),
    body("taskIds.*").isUUID().withMessage("Each taskId must be a valid UUID"),
    body("status").isIn(["todo", "inprogress", "done"]).withMessage("status is invalid"),
  ],
  handleValidationErrors,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { taskIds, status } = req.body;
      // Bulk update positions (keep as is for now, optimize later)
      const updates = taskIds.map((id: string, idx: number) =>
        prisma.task.update({
          where: { id },
          data: { position: idx, status, updatedAt: new Date() }
        })
      );
      await Promise.all(updates);
      const reordered = await prisma.task.findMany({
        where: { id: { in: taskIds } },
        orderBy: { position: 'asc' }
      });
      res.json({ success: true, tasks: reordered });
    } catch (error: any) {
      console.error("Error reordering tasks:", error.message ?? error);
      res.status(500).json({ error: "Failed to reorder tasks" });
    }
  }
);

// DELETE /tasks/:id
app.delete(
  "/tasks/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID")],
  handleValidationErrors,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.task.delete({ where: { id } });
      io.emit("delete-task", id);
      res.json({ success: true, message: "Task deleted" });
    } catch (error: any) {
      console.error("Error deleting task:", error.message ?? error);
      if (error.code === 'P2025') {
        res.status(404).json({ error: "Task not found or already deleted" });
      } else {
        res.status(500).json({ error: "Failed to delete task" });
      }
    }
  }
);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown omitted for brevity…
