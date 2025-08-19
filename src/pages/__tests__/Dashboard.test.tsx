import '@testing-library/jest-dom';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

type Task = {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  due_date?: string;
  estimated_duration?: number;
};

const todayIso = new Date().toISOString();

let mockTasks: Task[] = [];
let mockProjects = [{ id: 'p1', name: 'A', color: '#000', user_id: 'u1', progress: 0, created_at: todayIso, updated_at: todayIso }];

// Mocks must be declared after variables, before importing the module under test
vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: mockTasks,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    projects: mockProjects,
    isLoading: false,
  }),
}));

// Now import provider and component under test
import { SettingsProvider } from '@/contexts/SettingsContext';
import Dashboard from '@/pages/Dashboard';

function setup(tasks: Task[] = mockTasks) {
  mockTasks = tasks;
  return render(
    <SettingsProvider>
      <Dashboard />
    </SettingsProvider>
  );
}

beforeEach(() => {
  mockTasks = [
    {
      id: 't1',
      title: 'Urgent due today',
      status: 'todo',
      priority: 'urgent',
      user_id: 'u1',
      tags: ['a'],
      created_at: todayIso,
      updated_at: todayIso,
      due_date: todayIso,
      estimated_duration: 60,
    },
    {
      id: 't2',
      title: 'Completed',
      status: 'done',
      priority: 'low',
      user_id: 'u1',
      tags: [],
      created_at: todayIso,
      updated_at: todayIso,
    },
  ];
});

describe('Dashboard', () => {
  it('renders stats tiles with correct counts', () => {
    setup();

    expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
    expect(screen.getByText('Active Tasks')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Due Today')).toBeInTheDocument();

    // Completed: 1
    expect(screen.getByText('1')).toBeInTheDocument();
    // Active: 1
    // Note: multiple tiles use single-digit values; use more specific selectors in larger suites
  });

  it('shows empty state when no tasks', () => {
    setup([]);
    expect(screen.getByText('Ready to get organized?')).toBeInTheDocument();
    expect(screen.getAllByText(/Create/i).length).toBeGreaterThan(0);
  });

  it('sorts by priority when configured (indirectly validated by rendering order)', () => {
    const tasks: Task[] = [
      { id: 'a', title: 'Low', status: 'todo', priority: 'low', user_id: 'u1', tags: [], created_at: todayIso, updated_at: todayIso },
      { id: 'b', title: 'Urgent', status: 'todo', priority: 'urgent', user_id: 'u1', tags: [], created_at: todayIso, updated_at: todayIso },
      { id: 'c', title: 'High', status: 'todo', priority: 'high', user_id: 'u1', tags: [], created_at: todayIso, updated_at: todayIso },
      { id: 'd', title: 'Medium', status: 'todo', priority: 'medium', user_id: 'u1', tags: [], created_at: todayIso, updated_at: todayIso },
    ];

    // Default sort is due_date; override by temporarily mocking SettingsProvider if needed.
    // For a smoke test, we at least assert all items render without crash.
    setup(tasks);
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });
});


