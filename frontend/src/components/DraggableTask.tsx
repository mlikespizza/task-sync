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
        p-3 mb-2 bg-white rounded-lg shadow-sm border
        hover:shadow-md transition-shadow duration-200
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-center">
        <span 
          className="flex-1 cursor-pointer"
          onClick={onClick}
        >
          {task.title}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-2 px-2 py-1 text-red-500 hover:bg-red-50 rounded"
        >
          ×
        </button>
      </div>
    </li>
  );
}