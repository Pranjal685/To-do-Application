import React from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Calendar, User, Flag, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Task } from '@/types';
import { formatDate, formatDuration, getTaskPriorityColor } from '@/lib/utils';
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="space-y-3">
        {/* Priority and Actions */}
        <div className="flex items-center justify-between">
          <div
            className={`w-3 h-3 rounded-full ${
              task.priority === 'urgent' ? 'bg-red-500' :
              task.priority === 'high' ? 'bg-orange-500' :
              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            title={`${task.priority} priority`}
          />
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => onEdit(task)}
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-red-500 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Task Title and Description */}
        <div>
          <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Status Selector */}
        <div>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
            className="text-xs bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
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