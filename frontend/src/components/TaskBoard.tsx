"use client";
import { useEffect } from "react";
import socket from "@/lib/socket";
import { useTaskStore } from "@/store/taskStore";
import { Task } from "@/types";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DraggableTask from "@/components/DraggableTask";
import DroppableColumn from "@/components/DroppableColumn";

// Helper function to get next status
function getNextStatus(status: string): Task['status'] {
  if (status === "todo") return "inprogress";
  if (status === "inprogress") return "done";
  return "todo";
}

// Helper function to calculate new position
function calculateNewPosition(
  tasks: Task[], 
  targetIndex: number, 
  status: string
): number {
  const columnTasks = tasks
    .filter(t => t.status === status)
    .sort((a, b) => a.position - b.position);
  
  if (columnTasks.length === 0) return 0;
  if (targetIndex === 0) return Math.max(0, columnTasks[0].position - 1);
  if (targetIndex >= columnTasks.length) return columnTasks[columnTasks.length - 1].position + 1;
  
  const prevPos = columnTasks[targetIndex - 1].position;
  const nextPos = columnTasks[targetIndex].position;
  return (prevPos + nextPos) / 2;
}

export default function TaskBoard() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const setTasks = useTaskStore((s) => s.setTasks);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const authToken = useTaskStore((s) => s.authToken);

  // API call helper
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const response = await fetch(`http://localhost:3001${url}`, {
        headers,
        ...options,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Bulk reorder function
  const bulkReorder = async (taskIds: string[], status: string) => {
    try {
      await apiCall('/tasks/reorder', {
        method: 'PUT',
        body: JSON.stringify({ taskIds, status }),
      });
      
      // Emit socket event for real-time updates
      socket.emit('bulk-reorder', { taskIds, status });
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    }
  };

  // Drag end handler
  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id.toString();
    const overId = over.id.toString();
    
    if (taskId === overId) return;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    const isDroppingOnColumn = ["todo", "inprogress", "done"].includes(overId);

    if (isDroppingOnColumn) {
      // Dropped directly on a column
      const newStatus = overId as Task['status'];
      
      if (draggedTask.status !== newStatus) {
        // Moving to a different column
        const columnTasks = tasks
          .filter((t) => t.status === newStatus && t.id !== taskId)
          .sort((a, b) => a.position - b.position);
        
        const newPosition = columnTasks.length > 0 
          ? columnTasks[columnTasks.length - 1].position + 1 
          : 0;
        
        const updatedTask = { 
          ...draggedTask, 
          status: newStatus,
          position: newPosition
        };
        
        // Update local state
        updateTask(updatedTask);
        
        // Update backend
        await apiCall(`/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedTask),
        });
        
        // Emit socket event
        socket.emit("update-task", updatedTask);
        
        // Reorder the column
        const newColumnTaskIds = [...columnTasks.map(t => t.id), taskId];
        reorderTasks(newColumnTaskIds, newStatus);
        await bulkReorder(newColumnTaskIds, newStatus);
      }
      return;
    }

    // Dropped on another task
    const droppedOnTask = tasks.find((t) => t.id === overId);
    if (!droppedOnTask) return;

    const sameColumn = draggedTask.status === droppedOnTask.status;

    if (sameColumn) {
      // Reorder within the same column
      const columnTasks = tasks
        .filter((t) => t.status === draggedTask.status)
        .sort((a, b) => a.position - b.position);

      const oldIndex = columnTasks.findIndex(t => t.id === taskId);
      const newIndex = columnTasks.findIndex(t => t.id === overId);
      
      if (oldIndex === newIndex) return;

      // Calculate new positions
      const reorderedTasks = [...columnTasks];
      const [movedTask] = reorderedTasks.splice(oldIndex, 1);
      reorderedTasks.splice(newIndex, 0, movedTask);
      
      const taskIds = reorderedTasks.map(t => t.id);
      
      // Update local state
      reorderTasks(taskIds, draggedTask.status);
      
      // Update backend
      await bulkReorder(taskIds, draggedTask.status);
      
    } else {
      // Moving to a different column
      const targetStatus = droppedOnTask.status;
      const columnTasks = tasks
        .filter((t) => t.status === targetStatus && t.id !== taskId)
        .sort((a, b) => a.position - b.position);
      
      const insertIndex = columnTasks.findIndex(t => t.id === overId);
      const newPosition = calculateNewPosition(tasks, insertIndex, targetStatus);
      
      const updatedTask = { 
        ...draggedTask, 
        status: targetStatus,
        position: newPosition
      };
      
      // Update local state
      updateTask(updatedTask);
      
      // Update backend
      await apiCall(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTask),
      });
      
      // Emit socket event
      socket.emit("update-task", updatedTask);
      
      // Reorder the target column
      const newColumnTasks = [...columnTasks];
      newColumnTasks.splice(insertIndex, 0, updatedTask);
      const taskIds = newColumnTasks.map(t => t.id);
      
      reorderTasks(taskIds, targetStatus);
      await bulkReorder(taskIds, targetStatus);
    }
  }

  // Socket and data loading effects
  useEffect(() => {
    // Load initial tasks
    const loadTasks = async () => {
      try {
        const data = await apiCall('/tasks');
        setTasks(data);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };
    
    loadTasks();

    // Socket event listeners
    socket.on("receive-task", (task: Task) => {
      addTask(task);
    });
    
    socket.on("delete-task", (id: string) => {
      deleteTask(id);
    });
    
    socket.on("receive-updated-task", (updatedTask: Task) => {
      updateTask(updatedTask);
    });
    
    socket.on("receive-bulk-reorder", (data: { taskIds: string[], status: string }) => {
      reorderTasks(data.taskIds, data.status);
    });

    // Cleanup
    return () => {
      socket.off("receive-task");
      socket.off("receive-updated-task");
      socket.off("delete-task");
      socket.off("receive-bulk-reorder");
    };
  }, [addTask, updateTask, deleteTask, setTasks, reorderTasks]);

  // Drag sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Slightly higher to prevent accidental drags
      },
    })
  );

  // Render the task board
  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-sky-700 tracking-tight drop-shadow-sm">TaskSync Board</h1>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {(["todo", "inprogress", "done"] as const).map((status) => {
            const columnTasks = tasks
              .filter((t) => t.status === status)
              .sort((a, b) => a.position - b.position);
            return (
              <DroppableColumn key={status} id={status}>
                <header className="mb-6 flex flex-col items-center">
                  <span className={`text-lg font-bold tracking-wide uppercase px-4 py-1 rounded-full shadow-sm
                    ${status === 'todo' ? 'bg-sky-100 text-sky-700' : status === 'inprogress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}
                  `}>
                    {status === 'inprogress' ? 'In Progress' : status}
                  </span>
                </header>
                <SortableContext 
                  items={columnTasks.map((t) => t.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-3">
                    {columnTasks.map((task) => (
                      <DraggableTask
                        key={task.id}
                        id={task.id}
                        task={task}
                        onClick={async () => {
                          const nextStatus = getNextStatus(task.status);
                          const updatedTask = { 
                            ...task, 
                            status: nextStatus 
                          };
                          updateTask(updatedTask);
                          socket.emit("update-task", updatedTask);
                          try {
                            await apiCall(`/tasks/${task.id}`, {
                              method: "PUT",
                              body: JSON.stringify(updatedTask),
                            });
                          } catch (error) {
                            console.error('Failed to update task:', error);
                          }
                        }}
                        onDelete={async () => {
                          deleteTask(task.id);
                          socket.emit("delete-task", task.id);
                          try {
                            await apiCall(`/tasks/${task.id}`, {
                              method: "DELETE",
                            });
                          } catch (error) {
                            console.error('Failed to delete task:', error);
                          }
                        }}
                      />
                    ))}
                  </ul>
                </SortableContext>
                {columnTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center mt-10 text-gray-400 select-none">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="mb-2"><rect x="3" y="5" width="18" height="14" rx="2" fill="#e5e7eb"/><path d="M3 7h18" stroke="#cbd5e1" strokeWidth="2"/><rect x="7" y="11" width="10" height="2" rx="1" fill="#cbd5e1"/></svg>
                    <span className="text-sm">No tasks. Drop tasks here!</span>
                  </div>
                )}
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}