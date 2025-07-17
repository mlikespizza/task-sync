export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
  reorderTasks: (taskIds: string[], status: string) => void;
}