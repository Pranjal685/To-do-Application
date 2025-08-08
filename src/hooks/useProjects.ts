import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Project, CreateProjectForm } from '@/types';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:4000';

export function useProjects() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const res = await fetch(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    },
    enabled: !!user && !!token,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: CreateProjectForm) => {
      if (!user || !token) throw new Error('User not authenticated');
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return await res.json();
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData(['projects', user?.id], (old: Project[] = []) => [newProject, ...old]);
      toast.success('Project created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create project');
      console.error('Create project error:', error);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !token) throw new Error('User not authenticated');
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['projects', user?.id], (old: Project[] = []) =>
        old.filter((project) => project.id !== deletedId)
      );
      toast.success('Project deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete project');
      console.error('Delete project error:', error);
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject: createProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  };
}