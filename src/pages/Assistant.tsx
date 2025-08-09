import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAssistant } from '@/hooks/useAssistant';

export default function AssistantPage() {
  const { messages, isSending, sendMessage, clearChat } = useAssistant();
  const [input, setInput] = useState('');

  const onSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Chat to create and manage tasks through natural language.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[50vh] overflow-y-auto space-y-3 p-2 border rounded-md bg-background">
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
            <Button variant="secondary" onClick={clearChat}>Clear</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


