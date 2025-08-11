import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAssistant } from '@/hooks/useAssistant';
import { Button as UIButton } from '@/components/ui/Button';
import ThreadSidebar from '@/components/assistant/ThreadSidebar';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function AssistantPage() {
  const { messages, isSending, sendMessage, clearChat, threads, activeThreadId, createThread, switchThread, renameThread, deleteThread } = useAssistant();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('ai_sidebar_collapsed') === '1'; } catch { return false; }
  });

  const onSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try { localStorage.setItem('ai_sidebar_collapsed', next ? '1' : '0'); } catch {}
  };

  const contentOffsetClass = sidebarCollapsed ? '' : 'ml-64';

  return (
    <div className={`space-y-6 transition-all duration-300 ${contentOffsetClass}`}>
      <UIButton
        variant="secondary"
        size="icon"
        title={sidebarCollapsed ? "Expand chats" : "Collapse chats"}
        onClick={toggleSidebar}
        className="fixed left-64 top-20 z-40"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </UIButton>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">Chat to create and manage tasks through natural language.</p>
        </div>
        <div className="flex gap-2">
          <UIButton variant="secondary" onClick={() => createThread('New chat')} title="Start a new chat thread">New chat</UIButton>
          <UIButton variant="ghost" onClick={clearChat} title="Clear messages in the current chat without deleting the thread">Clear</UIButton>
        </div>
      </div>

      <Card className="transition-all duration-300">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[50vh] overflow-y-auto space-y-3 p-2 border rounded-md bg-background scrollbar">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">Start by asking: "Create a high priority task to review PR tomorrow 4pm"</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={
                  'inline-block max-w-[80%] px-3 py-2 rounded-lg ' +
                  (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border')
                }>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 bg-card border rounded-md p-2 text-sm"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
            />
            <Button onClick={onSend} disabled={isSending}>Send</Button>
            <Button variant="secondary" onClick={clearChat} title="Clear chat history and reset conversation">Clear</Button>
          </div>
        </CardContent>
      </Card>
      {/* Thread sidebar */}
      <ThreadSidebar
        threads={threads}
        activeId={activeThreadId}
        onCreate={() => createThread('New chat')}
        onSwitch={switchThread}
        onRename={renameThread}
        onDelete={deleteThread}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
    </div>
  );
}


