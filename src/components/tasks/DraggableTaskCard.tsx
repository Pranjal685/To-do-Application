import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import { Task } from '@/types';

// Keyboard event handlers for accessibility
const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    // Trigger drag start for keyboard users
    const element = event.currentTarget as HTMLElement;
    element.click();
  }
};

interface DraggableTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

const DraggableTaskCard = React.memo(function DraggableTaskCard({ task, onEdit }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
      className={`touch-manipulation ${isDragging ? 'task-card-dragging' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={`Drag task: ${task.title}`}
    >
      <TaskCard task={task} onEdit={onEdit} />
    </div>
  );
});

export default DraggableTaskCard;
