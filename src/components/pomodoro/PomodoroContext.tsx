import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { requestNotificationPermission } from '@/lib/notifications';
import { generateId } from '@/lib/utils';
import { usePomodoroSession } from '@/hooks/usePomodoro';
import type { PomodoroSession } from '@/types';

type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

export interface ActiveSessionState {
  phase: PomodoroPhase;
  startTimestamp: number; // epoch ms
  targetTimestamp: number; // epoch ms
  taskId?: string;
  projectId?: string;
  interruptions: number;
}

interface PomodoroContextType {
  phase: PomodoroPhase;
  isRunning: boolean;
  remainingMs: number;
  active?: ActiveSessionState;
  linkedTaskId?: string;
  setLinkedTask: (taskId?: string, projectId?: string) => void;
  start: (phase?: PomodoroPhase) => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  addMinute: (minutes?: number) => void;
  markDone: () => void;
  startCustomBreak: (minutes: number) => void;
  setCompletionNote: (note: string) => void;
  history: PomodoroSession[];
  clearHistory: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const ACTIVE_STORAGE_KEY = 'pom_active_v1';
const HISTORY_STORAGE_KEY = 'pom_history_v1';

export function usePomodoro(): PomodoroContextType {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider');
  return ctx;
}

function loadActive(): ActiveSessionState | undefined {
  try {
    const raw = localStorage.getItem(ACTIVE_STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as ActiveSessionState;
  } catch {
    return undefined;
  }
}

function saveActive(active?: ActiveSessionState) {
  if (!active) {
    localStorage.removeItem(ACTIVE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(active));
}

function loadHistory(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PomodoroSession[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: PomodoroSession[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { logSession } = usePomodoroSession();
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [active, setActive] = useState<ActiveSessionState | undefined>(() => loadActive());
  const [history, setHistory] = useState<PomodoroSession[]>(() => loadHistory());
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(active?.taskId);
  const [, setCompletionNoteState] = useState<string>('');
  const focusCountRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  // initialize from persisted active
  useEffect(() => {
    if (active) {
      setPhase(active.phase);
      const now = Date.now();
      const remaining = Math.max(0, active.targetTimestamp - now);
      setRemainingMs(remaining);
      setIsRunning(remaining > 0);
    } else {
      // default duration based on settings
      const initialMs = settings.pomodoro.focusMinutes * 60 * 1000;
      setRemainingMs(initialMs);
      setPhase('focus');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist active changes
  useEffect(() => {
    saveActive(active);
  }, [active]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // ticker loop based on wall clock (drift-safe)
  useEffect(() => {
    if (!active || !isRunning) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) return;
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, active.targetTimestamp - now);
      setRemainingMs(remaining);
      if (remaining === 0) {
        handleComplete();
      }
    }, 500);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isRunning]);

  // document.title updates
  useEffect(() => {
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const emoji = phase === 'focus' ? '🧠' : phase === 'short_break' ? '☕' : '🌿';
    document.title = `${emoji} ${time} • AI Todo`;
  }, [remainingMs, phase]);

  const durationForPhase = useCallback((p: PomodoroPhase) => {
    const s = settings.pomodoro;
    if (p === 'focus') return s.focusMinutes * 60 * 1000;
    if (p === 'short_break') return s.shortBreakMinutes * 60 * 1000;
    return s.longBreakMinutes * 60 * 1000;
  }, [settings.pomodoro]);

  const setLinkedTask = (taskId?: string, projectId?: string) => {
    setLinkedTaskId(taskId);
    setActive((prev) => (prev ? { ...prev, taskId, projectId } : prev));
  };

  const start = (overridePhase?: PomodoroPhase) => {
    const newPhase = overridePhase ?? phase;
    const now = Date.now();
    const target = now + durationForPhase(newPhase);
    const nextActive: ActiveSessionState = {
      phase: newPhase,
      startTimestamp: now,
      targetTimestamp: target,
      taskId: linkedTaskId,
      projectId: undefined,
      interruptions: 0,
    };
    setPhase(newPhase);
    setActive(nextActive);
    setIsRunning(true);
  };

  const pause = () => {
    if (!active) return;
    const now = Date.now();
    const remaining = Math.max(0, active.targetTimestamp - now);
    setIsRunning(false);
    // freeze by shifting target to now + remaining upon resume
    setActive({ ...active, startTimestamp: now, targetTimestamp: now + remaining });
  };

  const reset = () => {
    setIsRunning(false);
    const initialMs = durationForPhase('focus');
    setPhase('focus');
    setRemainingMs(initialMs);
    setActive(undefined);
  };

  const skip = () => {
    if (!active) return;
    // treat as complete of current phase and move on
    handleComplete(true);
  };

  const addMinute = (minutes: number = 1) => {
    const delta = minutes * 60 * 1000;
    
    if (active) {
      // If timer is active, update both the target and display
      setActive({ ...active, targetTimestamp: active.targetTimestamp + delta });
      setRemainingMs((prev) => Math.max(0, prev + delta));
    } else {
      // If timer is not active, just update the display time
      setRemainingMs((prev) => Math.max(0, prev + delta));
    }
  };

  const markDone = () => {
    // Mark linked task done is handled in page via hooks; this just stops the current focus
    if (phase === 'focus' && active) {
      handleComplete(false);
    } else {
      reset();
    }
  };

  const startCustomBreak = (minutes: number) => {
    // Stop current session if running
    if (active) {
      setIsRunning(false);
      setActive(undefined);
    }
    
    // Set up custom break
    const now = Date.now();
    const target = now + (minutes * 60 * 1000);
    const breakSession: ActiveSessionState = {
      phase: 'short_break', // Use short_break for custom breaks
      startTimestamp: now,
      targetTimestamp: target,
      taskId: linkedTaskId,
      projectId: undefined,
      interruptions: 0,
    };
    
    setPhase('short_break');
    setActive(breakSession);
    setRemainingMs(minutes * 60 * 1000);
    setIsRunning(true);
  };

  // expose setter via context under a stable name
  const setCompletionNote = (note: string) => setCompletionNoteState(note);

  const pushHistory = useCallback((session: PomodoroSession) => {
    setHistory((prev) => [session, ...prev].slice(0, 500));
  }, []);

  const handleComplete = async (skipped: boolean = false) => {
    if (!active) return;
    const permitted = await requestNotificationPermission();
    if (permitted && settings.pomodoro.enableNotifications) {
      const title = phase === 'focus' ? 'Focus complete' : 'Break complete';
      const body = phase === 'focus' ? 'Time for a break!' : 'Time to focus again.';
      // Lightweight notification without scheduling
      try {
        new Notification(title, { body });
      } catch {}
    }

    const startedAt = new Date(active.startTimestamp).toISOString();
    const endedAt = new Date().toISOString();
    const durationMinutes = Math.round((Date.now() - active.startTimestamp) / 60000);
    const newSession: PomodoroSession = {
      id: generateId(),
      task_id: active.taskId ?? '',
      user_id: 'local',
      duration: Math.max(durationMinutes, 0),
      type: phase === 'focus' ? 'work' : phase === 'short_break' ? 'short_break' : 'long_break',
      completed: !skipped,
      started_at: startedAt,
      completed_at: endedAt,
    };
    pushHistory(newSession);

    // Log to backend if task is linked and it's a focus session
    if (active.taskId && phase === 'focus') {
      logSession({
        taskId: active.taskId,
        duration: Math.max(durationMinutes, 0),
        type: 'work',
        interruptions: active.interruptions || 0,
        completed: !skipped,
      });
    }

    // Decide next phase
    let nextPhase: PomodoroPhase;
    if (phase === 'focus') {
      focusCountRef.current += 1;
      const everyN = Math.max(1, settings.pomodoro.longBreakEvery);
      nextPhase = focusCountRef.current % everyN === 0 ? 'long_break' : 'short_break';
    } else {
      nextPhase = 'focus';
    }

    const autoNext = settings.pomodoro.autoStartNextPhase;
    const now = Date.now();
    const nextTarget = now + durationForPhase(nextPhase);
    const nextActive: ActiveSessionState = {
      phase: nextPhase,
      startTimestamp: now,
      targetTimestamp: nextTarget,
      taskId: linkedTaskId,
      projectId: undefined,
      interruptions: 0,
    };
    setPhase(nextPhase);
    setActive(autoNext ? nextActive : undefined);
    setIsRunning(autoNext);
    setRemainingMs(autoNext ? durationForPhase(nextPhase) : durationForPhase(nextPhase));
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e as any).isComposing) return;
      if (e.code === 'Space') {
        e.preventDefault();
        isRunning ? pause() : start();
      } else if (e.key.toLowerCase() === 'r') {
        reset();
      } else if (e.key.toLowerCase() === 's') {
        skip();
      } else if (e.key === '+') {
        addMinute(1);
      } else if (e.key === '-') {
        addMinute(-1);
      } else if (e.key.toLowerCase() === 'b') {
        // Quick 5-minute break
        startCustomBreak(5);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, phase, active]);

  const value: PomodoroContextType = useMemo(() => ({
    phase,
    isRunning,
    remainingMs,
    active,
    linkedTaskId,
    setLinkedTask,
    start,
    pause,
    reset,
    skip,
    addMinute,
    markDone,
    startCustomBreak,
    setCompletionNote,
    history,
    clearHistory: () => setHistory([]),
  }), [phase, isRunning, remainingMs, active, linkedTaskId, history]);

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}


