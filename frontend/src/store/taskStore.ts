import { create } from 'zustand';
import { Task, TaskStore } from '@/types';

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  
  addTask: (task: Task) => {
    set((state) => ({
      tasks: [...state.tasks, task]
    }));
  },
  
  updateTask: (updatedTask: Task) => {
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    }));
  },
  
  deleteTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== id)
    }));
  },
  
  setTasks: (tasks: Task[]) => {
    set({ tasks });
  },
  
  reorderTasks: (taskIds: string[], status: string) => {
    set((state) => {
      const updatedTasks = [...state.tasks];
      
      // Update positions for tasks in the reordered column
      taskIds.forEach((id, index) => {
        const taskIndex = updatedTasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            position: index,
            status: status as Task['status']
          };
        }
      });
      
      return { tasks: updatedTasks };
    });
  }
}));