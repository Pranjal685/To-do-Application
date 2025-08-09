import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = 'http://localhost:4000/ai/chat';

export function useAssistant() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !token) return;
    const userMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'user', content };
    setMessages((m) => [...m, userMsg]);
    setIsSending(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: content })
      });
      const data = await res.json();
      const assistantContent = data?.text ?? '...';
      const aiMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: assistantContent };
      setMessages((m) => [...m, aiMsg]);
    } catch (e) {
      const err: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, something went wrong.' };
      setMessages((m) => [...m, err]);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => setMessages([]);

  return { messages, isSending, sendMessage, clearChat };
}


