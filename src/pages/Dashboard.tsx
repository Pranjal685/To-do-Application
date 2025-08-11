import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  Target,
  Zap,
  Brain,
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import TaskCard from '@/components/tasks/TaskCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useSettings } from '@/contexts/SettingsContext';

export default function Dashboard() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { settings } = useSettings();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<null | any>(null);
  // Recent tasks list will have its own scroll area; no need for page-level scroll

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
  }, [tasks, settings.taskView]);

  const completedTasks = visibleTasks.filter(task => task.status === 'done');
  const activeTasks = visibleTasks.filter(task => task.status !== 'done');
  const todayTasks = visibleTasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date().toDateString();
    const taskDate = new Date(task.due_date).toDateString();
    return today === taskDate;
  });

  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const stats = [
    {
      title: 'Tasks Completed',
      value: completedTasks.length.toString(),
      change: `${completionRate}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Active Tasks',
      value: activeTasks.length.toString(),
      change: `${tasks.length} total`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Projects',
      value: projects.length.toString(),
      change: 'Active projects',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Due Today',
      value: todayTasks.length.toString(),
      change: 'Tasks due',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const recentTasks = visibleTasks; // show all tasks within a scrollable container

  // Important: return after all hooks have been called to preserve hook order across renders
  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {tasks.length === 0 ? 'Welcome to AI Todo! 👋' : 'Good to see you back! 👋'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length === 0 
              ? 'Start by creating your first task to get organized!'
              : `You have ${activeTasks.length} active tasks. Let's make it productive!`
            }
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {tasks.length === 0 ? (
        // Empty State
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to get organized?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first task to start managing your productivity with AI-powered insights and smart scheduling.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Tasks</CardTitle>
                    <CardDescription>Your latest task activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 scrollbar">
                  {recentTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={(t)=> setEditingTask(t)} />
                  ))}
                  {recentTasks.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No tasks yet. Create your first task to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>AI Insights</span>
                </CardTitle>
                <CardDescription>Personalized productivity suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm">
                          Get Started
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create more tasks to unlock AI-powered productivity insights and suggestions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      <EditTaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} task={editingTask} />
    </div>
  );
}