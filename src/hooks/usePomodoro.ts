import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:4000';

interface LogPomodoroSessionParams {
  taskId: string;
  duration: number;
  type: 'work' | 'short_break' | 'long_break';
  interruptions?: number;
  completed: boolean;
}

export function usePomodoroSession() {
  const { token } = useAuth();

  const logSessionMutation = useMutation({
    mutationFn: async ({ taskId, duration, type, interruptions = 0, completed }: LogPomodoroSessionParams) => {
      if (!token) throw new Error('Not authenticated');
      
      const res = await fetch(`${API_URL}/tasks/${taskId}/pomodoro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration, type, interruptions, completed }),
      });
      
      if (!res.ok) throw new Error('Failed to log session');
      return await res.json();
    },
    onSuccess: (_, variables) => {
      if (variables.type === 'work' && variables.completed) {
        toast.success(`Logged ${variables.duration}min to task`);
      }
    },
    onError: (error) => {
      console.error('Failed to log Pomodoro session:', error);
      // Don't show error toast as this is non-critical
    },
  });

  return {
    logSession: logSessionMutation.mutate,
    isLogging: logSessionMutation.isPending,
  };
}
