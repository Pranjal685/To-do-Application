import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '@/types';
import {
  getToken,
  setToken,
  getUser,
  setUser as storeUser,
  clearAuthData,
} from '@/lib/authStorage';

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
  setDevAdmin: () => void; // Development-only bypass
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const API_URL = 'http://localhost:4000';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth data from storage on mount
    const storedToken = getToken();
    const storedUser = getUser();
    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid email or password');
      }

      const { user: userData, token: authToken } = await res.json();
      setUser(userData);
      setTokenState(authToken);
      storeUser(userData);
      setToken(authToken);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Signup failed. Please try again.');
      }

      const { user: userData, token: authToken } = await res.json();
      setUser(userData);
      setTokenState(authToken);
      storeUser(userData);
      setToken(authToken);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setTokenState(null);
    clearAuthData();
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user || !token) throw new Error('No user logged in');
    const res = await fetch(`${API_URL}/profiles/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const updatedUser = await res.json();
    setUser(updatedUser);
    storeUser(updatedUser);
  };

  /**
   * Development-only bypass for testing
   * This function is only available in development builds
   */
  const setDevAdmin = () => {
    // Guard: Only allow in development environment
    if (!import.meta.env.DEV) {
      console.warn('Dev admin access is not available in production');
      return;
    }

    const adminUser: AppUser = {
      id: '1',
      email: 'admin@example.com',
      full_name: 'Admin User',
      avatar_url: '',
      preferences: {
        theme: 'system' as const,
        timezone: 'UTC',
        work_hours: { start: '09:00', end: '17:00' },
        notifications: { email: true, push: true, reminders: true },
        ai_features: { auto_categorize: true, smart_scheduling: true, productivity_insights: true }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(adminUser);
    setTokenState('dev');
    storeUser(adminUser);
    setToken('dev');
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    setDevAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}