import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskCard from '@/components/tasks/TaskCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Task } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

export default function KanbanBoard() {
  const { tasks, isLoading } = useTasks();
  const { projects } = useProjects();
  const { settings } = useSettings();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const columns = useMemo(() => {
    if (settings.taskView.groupBy === 'project') {
      const groups = new Map<string, Task[]>();
      visibleTasks.forEach((t) => {
        const key = t.project_id || 'no_project';
        const arr = groups.get(key) || [];
        arr.push(t);
        groups.set(key, arr);
      });
      const result = Array.from(groups.entries()).map(([key, groupTasks]) => ({
        id: key,
        title: key === 'no_project' ? 'No Project' : projectMap.get(key) || 'Project',
        color: 'bg-gray-100 dark:bg-gray-800',
        tasks: groupTasks,
      }));
      return result.length ? result : [{ id: 'empty', title: 'No Tasks', color: 'bg-gray-100 dark:bg-gray-800', tasks: [] as Task[] }];
    }
    if (settings.taskView.groupBy === 'none') {
      return [
        {
          id: 'all',
          title: 'All Tasks',
          color: 'bg-gray-100 dark:bg-gray-800',
          tasks: visibleTasks,
        },
      ];
    }
    // Default: group by status
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
  }, [visibleTasks, settings.taskView.groupBy, projectMap]);

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
        // Kanban Board
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 pb-4">
          {columns.map((column, columnIndex) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: columnIndex * 0.1 }}
              className="w-full"
            >
              <Card className={`${column.color} border-0`}>
                <CardHeader className="p-4 md:p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-lg font-semibold flex items-center space-x-2">
                      <span>{column.title}</span>
                      <span className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded-full text-xs">
                        {column.tasks.length}
                      </span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 md:p-5 pt-0">
                  {column.tasks.map((task, taskIndex) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: taskIndex * 0.05 }}
                    >
                      <TaskCard task={task} />
                    </motion.div>
                  ))}

                  {/* Add Task Button */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground border-2 border-dashed border-muted-foreground/30 hover:border-primary/50"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add a task
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}