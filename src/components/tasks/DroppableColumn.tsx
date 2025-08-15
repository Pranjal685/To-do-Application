import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, MoreHorizontal } from 'lucide-react';
import DraggableTaskCard from './DraggableTaskCard';
import { Task } from '@/types';

interface DroppableColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAddTask: () => void;
  columnIndex: number;
}

const DroppableColumn = React.memo(function DroppableColumn({
  id,
  title,
  color,
  tasks,
  onEdit,
  onAddTask,
  columnIndex,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    },
  });





  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: columnIndex * 0.1 }}
      className="w-full"
    >
      <div ref={setNodeRef} className={`${isOver ? 'ring-4 ring-blue-500' : ''}`}>
        <Card 
          className={`${color} border-0 column-drop-zone ${isOver ? 'drag-over' : ''}`}
        >
        <CardHeader className="p-4 md:p-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center space-x-2">
              <span>{title}</span>
              <span className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded-full text-xs">
                {tasks.length}
              </span>
            </CardTitle>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent 
          className="space-y-3 p-4 md:p-5 pt-0 max-h-[70vh] overflow-y-auto scrollbar min-h-[200px]"
        >
          {tasks.map((task, taskIndex) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: taskIndex * 0.05 }}
            >
              <DraggableTaskCard task={task} onEdit={onEdit} />
            </motion.div>
          ))}

          {/* Add Task Button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground border-2 border-dashed border-muted-foreground/30 hover:border-primary/50"
            onClick={onAddTask}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a task
          </Button>
        </CardContent>
      </Card>
    </div>
    </motion.div>
  );
});

export default DroppableColumn;
