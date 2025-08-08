import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
  setDevAdmin: () => void; // Expose for dev bypass
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load token and user from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
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
      if (!res.ok) throw new Error('Invalid credentials');
      const { user, token } = await res.json();
      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
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
      if (!res.ok) throw new Error('Signup failed');
      const { user, token } = await res.json();
      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const setDevAdmin = () => {
    const adminUser = {
      id: '1',
      email: 'admin@example.com',
      full_name: 'Admin User',
      avatar_url: '',
      preferences: {
        theme: 'system' as 'system',
        timezone: 'UTC',
        work_hours: { start: '09:00', end: '17:00' },
        notifications: { email: true, push: true, reminders: true },
        ai_features: { auto_categorize: true, smart_scheduling: true, productivity_insights: true }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(adminUser);
    setToken('dev');
    localStorage.setItem('user', JSON.stringify(adminUser));
    localStorage.setItem('token', 'dev');
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    setDevAdmin, // Expose for dev bypass
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}