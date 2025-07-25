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

  // API call helper
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`http://localhost:3001${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
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

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{
        textAlign: 'center',
        fontSize: '2.2rem',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '40px',
        textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        background: 'linear-gradient(45deg, #fff, #f0f0f0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>Task Board</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '25px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {columns.map((column, index) => {
            const gradients = [
              'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              'linear-gradient(135deg, #4834d4, #686de0)',
              'linear-gradient(135deg, #00d2d3, #54a0ff)'
            ];
            
            return (
              <DroppableColumn key={column.id} id={column.id}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  minHeight: '400px'
                }}>
                  <h3 style={{
                    background: gradients[index],
                    color: 'white',
                    textAlign: 'center',
                    padding: '15px',
                    borderRadius: '15px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}>
                    {column.title} ({tasks.filter(task => task.status === column.id).length})
                  </h3>
                  
                  <SortableContext 
                    items={tasks.filter(task => task.status === column.id).map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minHeight: '300px'
                    }}>
                      {tasks
                        .filter((task) => task.status === column.id)
                        .sort((a, b) => a.position - b.position)
                        .map((task) => (
                          <DraggableTask 
                            key={task.id} 
                            task={task}
                            id={task.id}
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
                      
                      {tasks.filter(task => task.status === column.id).length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        color: '#999',
                        padding: '40px 20px',
                        border: '2px dashed #ddd',
                        borderRadius: '15px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        fontSize: '16px'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
                        No tasks yet
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </DroppableColumn>
          );
        })}
      </div>
    </DndContext>
  </div>
);
}