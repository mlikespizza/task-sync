import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableColumnProps {
  id: string;
  children: ReactNode;
}

export default function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[500px] p-4 rounded-lg border-2 border-dashed
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}
        transition-colors duration-200
      `}
    >
      {children}
    </div>
  );
}
