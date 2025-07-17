import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';

interface DraggableTaskProps {
  id: string;
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  children?: ReactNode;
}

export default function DraggableTask({ 
  id, 
  task, 
  onClick, 
  onDelete 
}: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`
        group p-4 mb-2 bg-white rounded-xl shadow border border-slate-200
        hover:shadow-lg hover:border-sky-300 transition-all duration-200
        flex items-center gap-2 cursor-grab relative
        ${isDragging ? 'opacity-60 shadow-2xl scale-95 z-10' : ''}
      `}
      aria-label={`Task: ${task.title}`}
      {...attributes}
    >
      {/* Drag handle */}
      <span
        {...listeners}
        className="mr-3 flex items-center justify-center text-slate-400 hover:text-sky-500 cursor-grab active:cursor-grabbing select-none"
        aria-label="Drag handle"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="7" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="17" r="1.5"/><circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/><circle cx="19" cy="7" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="19" cy="17" r="1.5"/></svg>
      </span>
      <span 
        className="flex-1 cursor-pointer text-slate-800 group-hover:text-sky-700 font-medium truncate"
        onClick={onClick}
      >
        {task.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ml-2 px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
        aria-label="Delete task"
      >
        ×
      </button>
    </li>
  );
}