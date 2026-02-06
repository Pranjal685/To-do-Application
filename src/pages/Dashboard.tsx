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
      color: 'text-success-mint',
      bgColor: 'bg-success-mint/10',
      borderColor: 'border-success-mint/20',
    },
    {
      title: 'Active Tasks',
      value: activeTasks.length.toString(),
      change: `${tasks.length} total`,
      icon: Clock,
      color: 'text-champagne-gold',
      bgColor: 'bg-champagne-gold/10',
      borderColor: 'border-champagne-gold/20',
    },
    {
      title: 'Projects',
      value: projects.length.toString(),
      change: 'Active projects',
      icon: Target,
      color: 'text-crystal-teal',
      bgColor: 'bg-crystal-teal/10',
      borderColor: 'border-crystal-teal/20',
    },
    {
      title: 'Due Today',
      value: todayTasks.length.toString(),
      change: 'Tasks due',
      icon: Calendar,
      color: 'text-warning-amber',
      bgColor: 'bg-warning-amber/10',
      borderColor: 'border-warning-amber/20',
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            {tasks.length === 0 ? 'Welcome to AI Todo! 👋' : 'Good to see you back! 👋'}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {tasks.length === 0 
              ? 'Start by creating your first task to get organized!'
              : `You have ${activeTasks.length} active tasks. Let's make it productive!`
            }
          </p>
        </div>
        <Button 
          variant="premium"
          size="lg"
          className="flex items-center space-x-2 w-full sm:w-auto"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card variant="glass" hover className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {stat.title}
                    </p>
                    <p className={`text-4xl font-bold mb-1 ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-xl ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-7 h-7 ${stat.color}`} />
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
          <Card variant="glass" className="max-w-2xl mx-auto">
            <CardContent className="p-12 md:p-16 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
                className="w-20 h-20 bg-champagne-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-champagne-gold/20"
              >
                <CheckCircle className="w-10 h-10 text-champagne-gold" />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Ready to get organized?</h3>
              <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Create your first task to start managing your productivity with AI-powered insights and smart scheduling.
              </p>
              <Button 
                variant="premium"
                size="lg" 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2 mx-auto"
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
            <Card variant="glass" hover>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Recent Tasks</CardTitle>
                    <CardDescription className="mt-1">Your latest task activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                  {recentTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={(t)=> setEditingTask(t)} />
                  ))}
                  {recentTasks.length === 0 && (
                    <p className="text-muted-foreground text-center py-12">
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
            <Card variant="glass" hover>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-xl font-bold">
                  <div className="w-8 h-8 bg-crystal-teal/10 rounded-lg flex items-center justify-center border border-crystal-teal/20">
                    <Brain className="w-5 h-5 text-crystal-teal" />
                  </div>
                  <span>AI Insights</span>
                </CardTitle>
                <CardDescription className="mt-1">Personalized productivity suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-champagne-gold/5 via-crystal-teal/5 to-champagne-gold/5 border border-champagne-gold/10">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-champagne-gold/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-champagne-gold/20">
                        <Zap className="w-5 h-5 text-champagne-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm mb-1">
                          Get Started
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
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