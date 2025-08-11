import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = 'http://localhost:4000/ai/chat';
// Threaded storage keys
const THREADS_INDEX_KEY = 'ai_threads_index'; // [{id,title,updatedAt}]
const ACTIVE_THREAD_KEY = 'ai_active_thread_id';
const CHAT_STORAGE_KEY = (id?: string) => `ai_thread_messages_${id || loadActiveThreadId()}`;
const FLOW_STORAGE_KEY = (id?: string) => `ai_thread_flow_${id || loadActiveThreadId()}`;

function loadActiveThreadId(): string {
  try {
    const v = localStorage.getItem(ACTIVE_THREAD_KEY);
    if (v) return v;
  } catch {}
  const id = crypto.randomUUID();
  saveActiveThreadId(id);
  ensureThreadInIndex({ id, title: 'New chat', updatedAt: Date.now() });
  return id;
}

function saveActiveThreadId(id: string) {
  try { localStorage.setItem(ACTIVE_THREAD_KEY, id); } catch {}
}

type ThreadMeta = { id: string; title: string; updatedAt: number };

function loadThreadsIndex(): ThreadMeta[] {
  try {
    const v = localStorage.getItem(THREADS_INDEX_KEY);
    if (v) return JSON.parse(v);
  } catch {}
  return [];
}

function saveThreadsIndex(threads: ThreadMeta[]) {
  try { localStorage.setItem(THREADS_INDEX_KEY, JSON.stringify(threads)); } catch {}
}

function ensureThreadInIndex(meta: ThreadMeta) {
  const list = loadThreadsIndex();
  const existing = list.find(t => t.id === meta.id);
  if (existing) {
    existing.title = meta.title || existing.title;
    existing.updatedAt = meta.updatedAt;
  } else {
    list.unshift(meta);
  }
  saveThreadsIndex(list.slice(0, 50));
}

function loadChatHistory(): AssistantMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY());
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (Array.isArray(parsed) && parsed.every(m => m.id && m.role && typeof m.content === 'string')) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load chat history:', e);
  }
  return [];
}

function saveChatHistory(messages: AssistantMessage[]) {
  try {
    // Keep only last 50 messages for performance
    const toStore = messages.slice(-50);
    localStorage.setItem(CHAT_STORAGE_KEY(), JSON.stringify(toStore));
  } catch (e) {
    console.warn('Failed to save chat history:', e);
  }
}

function loadFlowState(): { values: any; confirmationReady: boolean } | null {
  try {
    const stored = localStorage.getItem(FLOW_STORAGE_KEY());
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load flow state:', e);
  }
  return null;
}

function saveFlowState(state: { values: any; confirmationReady: boolean } | null) {
  try {
    if (state) {
      localStorage.setItem(FLOW_STORAGE_KEY(), JSON.stringify(state));
    } else {
      localStorage.removeItem(FLOW_STORAGE_KEY());
    }
  } catch (e) {
    console.warn('Failed to save flow state:', e);
  }
}

export function useAssistant() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>(loadChatHistory);
  const [isSending, setIsSending] = useState(false);
  const [flowState, setFlowState] = useState<{ values: any; confirmationReady: boolean } | null>(loadFlowState);
  const [threads, setThreads] = useState<ThreadMeta[]>(loadThreadsIndex);
  const [activeThreadId, setActiveThreadId] = useState<string>(loadActiveThreadId);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveChatHistory(messages);
    // Update threads index title heuristically (first user message) and timestamp
    const idx = loadThreadsIndex();
    const id = loadActiveThreadId();
    const firstUser = messages.find(m => m.role === 'user');
    const title = firstUser ? (firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? '…' : '')) : 'New chat';
    ensureThreadInIndex({ id, title, updatedAt: Date.now() });
    setThreads(loadThreadsIndex());
    setActiveThreadId(id);
  }, [messages]);

  // Save flow state whenever it changes
  useEffect(() => {
    saveFlowState(flowState);
  }, [flowState]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !token) return;
    const userMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'user', content };
    setMessages((m) => [...m, userMsg]);
    setIsSending(true);
    try {
      // Global commands: clear/reset/start fresh
      if (/\b(clear( the)? (chat|screen)|reset (chat|conversation)|start fresh)\b/i.test(content)) {
        clearChat();
        const aiMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: 'Chat cleared. How can I help next?' };
        setMessages((m) => [...m, aiMsg]);
        return;
      }

      // If the user says "create a task", use the task-flow endpoint
      const isCreateIntent = /\b(create|add)\b.*\btask\b/i.test(content);
      let assistantContent = '';
      const wantsManual = /\bmanual(ly)?\b|\b(step[- ]?by[- ]?step|instructions?|guide|roadmap)\b|\bhow (do|to) (i )?create\b|\bwhat (are you|will you) (do|doing)\b|\bexplain\b|\bwalk me through\b|\bshow (me )?steps\b|\bpreview how you will do\b/i.test(content);
      const inFlow = Boolean(flowState);
      const isYes = /^\s*(yes|y)\s*$/i.test(content);
      const isCancel = /^(no|n|cancel|stop|abort|never mind|not now|later|nope|nah)\b/i.test(content.trim());

      // Handle in-flow: keep routing messages to task-flow until confirmation is ready or user cancels
      if (inFlow) {
        if (isCancel) {
          setFlowState(null);
          const aiMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: 'Okay, canceled. What would you like to do next?' };
          setMessages((m) => [...m, aiMsg]);
          return;
        }
        if (isYes && flowState?.confirmationReady) {
          // Confirm using cached flow state (idempotent)
          const v = flowState.values || {};
          // Build a robust description from extracted values. Avoid using the original user command.
          const buildDescription = (val: any): string => {
            const looksLikeCommand = (text?: string): boolean => {
              if (!text) return false;
              const t = String(text).toLowerCase();
              return /\b(create|add)\b.*\btask\b/.test(t) || /\bpomodoro\b|\b\d+\s*\/\s*\d+\b|\bx\s*\d+\b/.test(t);
            };
            const lines: string[] = [];
            lines.push(`Task: ${val.title || 'Untitled task'}`);
            if (val.priority) lines.push(`Priority: ${val.priority}`);
            if (val.due_date) {
              try { lines.push(`Due: ${new Date(val.due_date).toLocaleString()}`); } catch { lines.push(`Due: ${val.due_date}`); }
            }
            if (val.duration_minutes || val.break_interval_minutes || val.break_count != null) {
              lines.push('');
              lines.push('Pomodoro Settings:');
              if (val.duration_minutes) lines.push(`- Focus Duration: ${val.duration_minutes} minutes`);
              if (val.break_interval_minutes) lines.push(`- Break Interval: ${val.break_interval_minutes} minutes`);
              if (val.break_count != null) lines.push(`- Break Count: ${val.break_count} cycles`);
            }
            if (Array.isArray(val.subtasks) && val.subtasks.length) {
              lines.push('');
              lines.push('Subtasks:');
              for (const s of val.subtasks) lines.push(`- ${s}`);
            }
            if (val.description && !looksLikeCommand(val.description)) {
              lines.push('');
              lines.push(val.description);
            }
            return lines.join('\n');
          };

          const createRes = await fetch('http://localhost:4000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              title: v.title,
              description: buildDescription(v),
              priority: v.priority || 'medium',
              due_date: v.due_date,
              tags: v.tags || [],
              project_id: v.project_id,
              estimated_duration: v.duration_minutes,
            })
          });
          assistantContent = createRes.ok ? 'Task created successfully!' : 'Failed to create task. Please try again.';
          setFlowState(null);
          const aiMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: assistantContent };
          setMessages((m) => [...m, aiMsg]);
          return;
        }

        // Continue the flow with backend guidance (even if user typed "yes" but not ready yet)
        const res = await fetch('http://localhost:4000/ai/task-flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: content, state: { ...(flowState || {}), mode } })
        });
        const data = await res.json();
        setFlowState({ values: data.values, confirmationReady: data.confirmationReady });
        setMode('auto');
        assistantContent = data.assistantText || 'Okay.';
        const aiMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: assistantContent };
        setMessages((m) => [...m, aiMsg]);
        return;
      }

      if (isCreateIntent || wantsManual || mode === 'manual') {
        const res = await fetch('http://localhost:4000/ai/task-flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: content, state: { ...(flowState || {}), mode: wantsManual ? 'manual' : mode } })
        });
        const data = await res.json();
        // If backend switches to manual mode, show its manual guide and do not set flow state
        if (data?.mode === 'manual' && data?.manualGuide) {
          const guide = data.manualGuide as any;
          const steps = Array.isArray(guide.steps) ? guide.steps : [];
          assistantContent = `${guide.heading || 'Manual task creation'}\n\n` + steps.map((s: string, i: number) => `${i+1}. ${s}`).join('\n');
          setFlowState(null);
          setMode('manual');
        } else {
          setFlowState({ values: data.values, confirmationReady: data.confirmationReady });
          setMode('auto');
        }
        assistantContent = assistantContent || data.assistantText || 'Okay.';
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: content })
        });
        const data = await res.json();
        assistantContent = data?.text ?? '...';
      }
      const aiMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: assistantContent };
      setMessages((m) => [...m, aiMsg]);
    } catch (e) {
      const err: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, something went wrong.' };
      setMessages((m) => [...m, err]);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setFlowState(null);
    localStorage.removeItem(CHAT_STORAGE_KEY());
    localStorage.removeItem(FLOW_STORAGE_KEY());
    setMode('auto');
  };

  // Thread management API
  const createThread = (title?: string) => {
    const id = crypto.randomUUID();
    ensureThreadInIndex({ id, title: title || 'New chat', updatedAt: Date.now() });
    saveActiveThreadId(id);
    setMessages([]);
    setFlowState(null);
    setThreads(loadThreadsIndex());
    setActiveThreadId(id);
    setMode('auto');
  };

  const switchThread = (id: string) => {
    saveActiveThreadId(id);
    setMessages(loadChatHistory());
    setFlowState(loadFlowState());
    setActiveThreadId(id);
    setMode('auto');
  };

  const renameThread = (id: string, title: string) => {
    ensureThreadInIndex({ id, title, updatedAt: Date.now() });
    setThreads(loadThreadsIndex());
  };

  const deleteThread = (id: string) => {
    // Remove metadata
    const list = loadThreadsIndex().filter(t => t.id !== id);
    saveThreadsIndex(list);
    // Remove stored data
    localStorage.removeItem(`ai_thread_messages_${id}`);
    localStorage.removeItem(`ai_thread_flow_${id}`);
    // If deleting active thread, create a new one
    if (id === loadActiveThreadId()) {
      createThread('New chat');
    }
    setThreads(loadThreadsIndex());
  };

  return {
    messages,
    isSending,
    sendMessage,
    clearChat,
    // threads API for sidebar
    threads,
    activeThreadId,
    createThread,
    switchThread,
    renameThread,
    deleteThread,
  };
}


