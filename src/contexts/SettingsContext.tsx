import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoStartNext: boolean;
}

export interface CalendarSettings {
  firstDayOfWeek: 0 | 1; // 0: Sunday, 1: Monday
}

export interface TaskViewSettings {
  sortBy: 'due_date' | 'priority' | 'created_at';
  groupBy: 'none' | 'status' | 'project';
  showCompleted: boolean;
}

export interface AppSettings {
  // Notifications
  desktopNotifications: boolean;
  reminderMinutesBefore?: number | null;

  // Task defaults
  defaultPriority: TaskPriority;
  defaultEstimatedDuration?: number | null; // minutes
  defaultDueDateOffsetDays?: number | null; // e.g. 2 => now + 2 days

  // Task view preferences
  taskView: TaskViewSettings;

  // Calendar
  calendar: CalendarSettings;

  // Pomodoro
  pomodoro: PomodoroSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  desktopNotifications: false,
  reminderMinutesBefore: 30,
  defaultPriority: 'medium',
  defaultEstimatedDuration: 30,
  defaultDueDateOffsetDays: null,
  taskView: {
    sortBy: 'due_date',
    groupBy: 'status',
    showCompleted: true,
  },
  calendar: {
    firstDayOfWeek: 1,
  },
  pomodoro: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartNext: false,
  },
};

const STORAGE_KEY = 'app_settings_v1';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw) as AppSettings;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

