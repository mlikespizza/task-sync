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
    <section
      ref={setNodeRef}
      className={`
        min-h-[500px] p-6 rounded-2xl border-2 border-dashed
        bg-gradient-to-b from-slate-50 to-slate-100
        shadow-md flex flex-col transition-all duration-200
        ${isOver ? 'border-sky-400 bg-sky-50/80 shadow-lg scale-[1.02]' : 'border-gray-200'}
      `}
      aria-label={`Task column: ${id}`}
    >
      {children}
    </section>
  );
}
