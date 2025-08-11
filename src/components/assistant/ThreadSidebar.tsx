import React, { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';

type ThreadMeta = { id: string; title: string; updatedAt: number };

interface Props {
  threads: ThreadMeta[];
  activeId: string;
  onCreate: () => void;
  onSwitch: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function ThreadSidebar({ threads, activeId, onCreate, onSwitch, onRename, onDelete, collapsed = false, onToggle }: Props) {
  const sorted = useMemo(() => [...threads].sort((a, b) => b.updatedAt - a.updatedAt), [threads]);
  return (
    <aside className={`fixed left-64 top-16 bottom-0 w-64 bg-card border-r border-border overflow-y-auto p-3 space-y-2 transition-transform duration-300 ${collapsed ? '-translate-x-full' : 'translate-x-0'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Chats</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onCreate}>New</Button>
        </div>
      </div>
      <div className="space-y-1">
        {sorted.length === 0 && (
          <div className="text-xs text-muted-foreground">No chats yet.</div>
        )}
        {sorted.map((t) => (
          <div key={t.id} className={`group flex items-center justify-between px-2 py-2 rounded hover:bg-accent ${t.id === activeId ? 'bg-accent' : ''}`}>
            <button className="text-left flex-1 text-sm truncate" onClick={() => onSwitch(t.id)} title={t.title}>{t.title || 'New chat'}</button>
            <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => {
                const title = prompt('Rename chat', t.title || 'New chat');
                if (title !== null) onRename(t.id, title);
              }}>Rename</button>
              <button className="text-xs text-destructive hover:underline" onClick={() => onDelete(t.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}


