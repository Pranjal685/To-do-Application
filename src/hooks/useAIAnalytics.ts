import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = 'http://localhost:4000/ai/analytics';

interface Params { from: string; to: string }

export function useAIAnalytics({ from, to }: Params) {
  const { token } = useAuth();

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const overviewQuery = useQuery({
    queryKey: ['ai-ov', from, to, token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers });
      if (!res.ok) throw new Error('Failed to load overview');
      return res.json() as Promise<any>;
    }
  });

  const trendsQuery = useQuery({
    queryKey: ['ai-trends', from, to, token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/trends?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers });
      if (!res.ok) throw new Error('Failed to load trends');
      return res.json() as Promise<any[]>;
    }
  });

  const funnelQuery = useQuery({
    queryKey: ['ai-funnel', from, to, token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/funnel?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers });
      if (!res.ok) throw new Error('Failed to load funnel');
      return res.json() as Promise<any>;
    }
  });

  const costQuery = useQuery({
    queryKey: ['ai-cost', from, to, token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/cost?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers });
      if (!res.ok) throw new Error('Failed to load cost');
      return res.json() as Promise<any[]>;
    }
  });

  return {
    overview: overviewQuery.data,
    trends: trendsQuery.data,
    funnel: funnelQuery.data,
    cost: costQuery.data,
    isLoading: overviewQuery.isLoading || trendsQuery.isLoading || funnelQuery.isLoading || costQuery.isLoading,
    error: overviewQuery.error || trendsQuery.error || funnelQuery.error || costQuery.error,
  };
}


