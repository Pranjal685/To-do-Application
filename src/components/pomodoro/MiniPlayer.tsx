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
    <div 
      className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <span className="text-xs font-semibold capitalize text-muted-foreground uppercase tracking-wider">
        {phase.replace('_',' ')}
      </span>
      <span className="font-mono text-sm font-bold text-foreground tabular-nums">
        {formatTime(remainingMs)}
      </span>
      {isRunning ? (
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={pause}
          className="w-8 h-8 rounded-lg hover:bg-error-rose/10 hover:text-error-rose"
        >
          <Pause className="w-4 h-4"/>
        </Button>
      ) : (
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => start()}
          className="w-8 h-8 rounded-lg hover:bg-success-mint/10 hover:text-success-mint"
        >
          <Play className="w-4 h-4"/>
        </Button>
      )}
    </div>
  );
}


