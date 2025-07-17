import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("new-task", (task) => {
    socket.broadcast.emit("receive-task", task);
  });

  socket.on("update-task", (updatedTask) => {
    socket.broadcast.emit("receive-updated-task", updatedTask);
  });

  socket.on("delete-task", (taskId) => {
    socket.broadcast.emit("delete-task", taskId);
  });

  socket.on("bulk-reorder", (data) => {
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
app.get("/tasks", async (_req, res) => {
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
app.post("/tasks", async (req, res) => {
  try {
    const { id, title, status, position, createdAt, updatedAt } = req.body;

    if (!id || !title || !status) {
      return res.status(400).json({ error: "Missing required fields: id, title, status" });
    }

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
});

// PUT /tasks/:id
app.put("/tasks/:id", async (req, res) => {
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
});

// PUT /tasks/reorder
app.put("/tasks/reorder", async (req, res) => {
  try {
    const { taskIds, status } = req.body;
    if (!Array.isArray(taskIds) || !status) {
      return res.status(400).json({ error: "Invalid request: taskIds must be an array and status is required" });
    }

    // Bulk update positions
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
});

// DELETE /tasks/:id
app.delete("/tasks/:id", async (req, res) => {
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
});

// 404 handler
app.use((_req, res) => {
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
