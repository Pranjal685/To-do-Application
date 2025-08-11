import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Task, CreateTaskForm, UpdateTaskForm } from '@/types';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:4000';

export function useTasks() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const dedupeById = (list: Task[]): Task[] => {
    const seen = new Set<string>();
    const result: Task[] = [];
    for (const t of list || []) {
      const key = String((t as any).id);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(t);
      }
    }
    return result;
  };

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
      const data = await res.json();
      return dedupeById(data);
    },
    enabled: !!user && !!token,
    select: (data) => dedupeById(data as Task[]),
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
      queryClient.setQueryData(['tasks', user?.id], (old: Task[] = []) => {
        const merged = [newTask, ...old];
        // Deduplicate by id to avoid double-counting during background refetches
        const seen = new Set<string>();
        const list: Task[] = [];
        for (const t of merged) {
          const key = String((t as any).id);
          if (!seen.has(key)) { seen.add(key); list.push(t); }
        }
        return list;
      });
      // Fetch authoritative list from server to prevent any cache drift
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
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
        old.map((task) => (String(task.id) === String(updatedTask.id) ? updatedTask : task))
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
        old.filter((task) => String(task.id) !== String(deletedId))
      );
      // Ensure server truth in case of id type mismatches
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
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