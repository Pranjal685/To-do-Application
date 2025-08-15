import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import DroppableColumn from '@/components/tasks/DroppableColumn';
import TaskCard from '@/components/tasks/TaskCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Task } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/Card';


export default function KanbanBoard() {
  const { tasks, isLoading, updateTask } = useTasks();
  const { projects } = useProjects();
  const { settings } = useSettings();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  const visibleTasks = useMemo(() => {
    const base = settings.taskView.showCompleted ? tasks : tasks.filter((t) => t.status !== 'done');
    const sorted = [...base].sort((a, b) => {
      switch (settings.taskView.sortBy) {
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'created_at':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'due_date':
        default: {
          const at = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
          const bt = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
          return at - bt;
        }
      }
    });
    return sorted;
  }, [tasks, settings.taskView, priorityOrder]);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  // Drag and drop event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Validate that the drop target is a valid column
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(newStatus)) {
      return;
    }

    // Only update if the status actually changed
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      const updates: any = { 
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null
      };
      
      updateTask(taskId, updates);
      
      // Show success notification
      const statusLabels = {
        todo: 'To Do',
        in_progress: 'In Progress',
        review: 'Review',
        done: 'Done'
      };
      
      toast.success(`Task moved to ${statusLabels[newStatus as keyof typeof statusLabels]}`);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Validate that the drop target is a valid column
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(newStatus)) {
      return;
    }

    // Only update if the status actually changed
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      const updates: any = { 
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null
      };
      
      updateTask(taskId, updates);
    }
  };



  const columns = useMemo(() => {
    // For drag-and-drop functionality, we only support status-based grouping
    return [
      {
        id: 'todo',
        title: 'To Do',
        color: 'bg-gray-100 dark:bg-gray-800',
        tasks: visibleTasks.filter((task) => task.status === 'todo'),
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        color: 'bg-blue-100 dark:bg-blue-900/30',
        tasks: visibleTasks.filter((task) => task.status === 'in_progress'),
      },
      {
        id: 'review',
        title: 'Review',
        color: 'bg-yellow-100 dark:bg-yellow-900/30',
        tasks: visibleTasks.filter((task) => task.status === 'review'),
      },
      {
        id: 'done',
        title: 'Done',
        color: 'bg-green-100 dark:bg-green-900/30',
        tasks: visibleTasks.filter((task) => task.status === 'done'),
      },
    ];
  }, [visibleTasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kanban Board</h1>
          <p className="text-muted-foreground mt-1">
            Organize and track your tasks with drag-and-drop simplicity
          </p>
        </div>
        <Button 
          className="flex items-center space-x-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </Button>
      </div>



      {tasks.length === 0 ? (
        // Empty State
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first task to see it organized in the Kanban board format.
              </p>
              <Button 
                size="lg" 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Task</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        // Kanban Board with Drag and Drop
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 pb-4">
            {columns.map((column, columnIndex) => (
              <DroppableColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={column.tasks}
                onEdit={(t) => setEditingTask(t)}
                onAddTask={() => setIsCreateModalOpen(true)}
                columnIndex={columnIndex}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="drag-overlay">
                <TaskCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      <EditTaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} task={editingTask} />
    </div>
  );
}