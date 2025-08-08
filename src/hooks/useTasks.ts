import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Task, CreateTaskForm, UpdateTaskForm } from '@/types';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:4000';

export function useTasks() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const res = await fetch(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return await res.json();
    },
    enabled: !!user && !!token,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskForm) => {
      if (!user || !token) throw new Error('User not authenticated');
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error('Failed to create task');
      return await res.json();
    },
    onSuccess: (newTask) => {
      queryClient.setQueryData(['tasks', user?.id], (old: Task[] = []) => [newTask, ...old]);
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create task');
      console.error('Create task error:', error);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTaskForm }) => {
      if (!user || !token) throw new Error('User not authenticated');
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return await res.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(['tasks', user?.id], (old: Task[] = []) =>
        old.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
      toast.success('Task updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error('Update task error:', error);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !token) throw new Error('User not authenticated');
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['tasks', user?.id], (old: Task[] = []) =>
        old.filter((task) => task.id !== deletedId)
      );
      toast.success('Task deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete task');
      console.error('Delete task error:', error);
    },
  });

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createTaskMutation.mutate,
    updateTask: (id: string, updates: UpdateTaskForm) =>
      updateTaskMutation.mutate({ id, updates }),
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
}