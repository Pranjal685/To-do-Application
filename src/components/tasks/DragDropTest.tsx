import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TestItem {
  id: string;
  content: string;
  status: string;
}

const TestDraggable = ({ item }: { item: TestItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 border rounded shadow cursor-move"
    >
      {item.content}
    </div>
  );
};

const TestDroppable = ({ id, items, title }: { id: string; items: TestItem[]; title: string }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-4 border-2 border-dashed min-h-[200px] ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
    >
      <h3 className="font-bold mb-2">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <TestDraggable key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default function DragDropTest() {
  const [items, setItems] = useState<TestItem[]>([
    { id: '1', content: 'Task 1', status: 'todo' },
    { id: '2', content: 'Task 2', status: 'todo' },
    { id: '3', content: 'Task 3', status: 'in_progress' },
  ]);

  const [activeItem, setActiveItem] = useState<TestItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find(i => i.id === event.active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);

    const { active, over } = event;

    if (!over) return;

    const itemId = active.id as string;
    const newStatus = over.id as string;

    setItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );

    console.log(`Moved item ${itemId} to ${newStatus}`);
  };

  const todoItems = items.filter(item => item.status === 'todo');
  const inProgressItems = items.filter(item => item.status === 'in_progress');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Drag and Drop Test</h1>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-4">
          <TestDroppable id="todo" items={todoItems} title="To Do" />
          <TestDroppable id="in_progress" items={inProgressItems} title="In Progress" />
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="bg-white p-4 border rounded shadow opacity-80">
              {activeItem.content}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
