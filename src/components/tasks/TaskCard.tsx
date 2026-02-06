import React from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Calendar, User, Flag, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Task } from '@/types';
import { formatDate, formatDuration, getTaskPriorityColor, cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { deleteTask, updateTask } = useTasks();

  const handleStatusChange = (newStatus: Task['status']) => {
    updateTask(task.id, { 
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  const priorityColors = {
    urgent: 'border-l-error-rose bg-error-rose/5',
    high: 'border-l-champagne-gold bg-champagne-gold/5',
    medium: 'border-l-warning-amber bg-warning-amber/5',
    low: 'border-l-success-mint bg-success-mint/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        'glass-card border-l-4 p-5 md:p-6 cursor-pointer group relative overflow-hidden transition-all duration-300',
        priorityColors[task.priority]
      )}
    >
      <div className="space-y-4">
        {/* Priority and Actions */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              task.priority === 'urgent' ? 'bg-error-rose' :
              task.priority === 'high' ? 'bg-champagne-gold' :
              task.priority === 'medium' ? 'bg-warning-amber' : 'bg-success-mint'
            )}
            title={`${task.priority} priority`}
          />
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg hover:bg-champagne-gold/20 hover:text-champagne-gold"
                onClick={() => onEdit(task)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg hover:bg-error-rose/20 hover:text-error-rose"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Task Title and Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-foreground text-base md:text-lg leading-tight line-clamp-2 group-hover:text-champagne-gold transition-colors">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-champagne-gold/20 text-champagne-gold text-xs rounded-full font-semibold border border-champagne-gold/30"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-3 py-1 bg-muted/50 text-muted-foreground text-xs rounded-full border border-border">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Status Display */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status:</span>
          <span className={cn(
            'text-xs px-3 py-1 rounded-full font-semibold',
            task.status === 'todo' ? 'bg-muted/50 text-muted-foreground border border-border' :
            task.status === 'in_progress' ? 'bg-champagne-gold/10 text-champagne-gold border border-champagne-gold/20' :
            task.status === 'review' ? 'bg-warning-amber/10 text-warning-amber border border-warning-amber/20' :
            'bg-success-mint/10 text-success-mint border border-success-mint/20'
          )}>
            {task.status === 'todo' ? 'To Do' :
             task.status === 'in_progress' ? 'In Progress' :
             task.status === 'review' ? 'Review' : 'Done'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            {task.due_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}
            {task.estimated_duration && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(task.estimated_duration)}</span>
              </div>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${getTaskPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>
    </motion.div>
  );
}