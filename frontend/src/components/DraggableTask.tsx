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
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '15px',
        marginBottom: '12px',
        boxShadow: isDragging 
          ? '0 8px 25px rgba(0, 0, 0, 0.15)' 
          : '0 4px 15px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging 
          ? `${CSS.Transform.toString(transform)} rotate(2deg)` 
          : CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : 'all 0.2s ease',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 1
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span 
          style={{
            flex: 1,
            fontSize: '16px',
            color: '#333',
            fontWeight: '500',
            cursor: 'pointer',
            wordBreak: 'break-word'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {task.title}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff6b6b',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '5px 8px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '30px',
            height: '30px'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255, 107, 107, 0.1)';
            target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'none';
            target.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}