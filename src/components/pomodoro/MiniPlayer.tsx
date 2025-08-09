import { usePomodoro } from '@/components/pomodoro/PomodoroContext';
import { Button } from '@/components/ui/Button';
import { Play, Pause } from 'lucide-react';

function formatTime(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function MiniPlayer() {
  const { isRunning, remainingMs, start, pause, phase } = usePomodoro();
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-card border border-border">
      <span className="text-xs capitalize text-muted-foreground">{phase.replace('_',' ')}</span>
      <span className="font-mono text-sm">{formatTime(remainingMs)}</span>
      {isRunning ? (
        <Button size="icon" variant="ghost" onClick={pause}><Pause className="w-4 h-4"/></Button>
      ) : (
        <Button size="icon" variant="ghost" onClick={() => start()}><Play className="w-4 h-4"/></Button>
      )}
    </div>
  );
}


