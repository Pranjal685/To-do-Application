import { useMemo, useRef, useState } from 'react';
import { usePomodoro } from '@/components/pomodoro/PomodoroContext';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus, CheckCircle2, Coffee, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function formatTime(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function InnerPomodoroPage() {
  const { tasks, createTask, updateTask, isCreating } = useTasks();
  const { projects } = useProjects();
  const {
    phase, isRunning, remainingMs, linkedTaskId,
    setLinkedTask, start, pause, reset, skip, addMinute, markDone, startCustomBreak,
    history, clearHistory,
  } = usePomodoro();
  const quickTitleRef = useRef<HTMLInputElement>(null);
  const breakDurationRef = useRef<HTMLInputElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showBreakInput, setShowBreakInput] = useState(false);

  const currentTask = useMemo(() => tasks.find((t: any) => t.id === linkedTaskId), [tasks, linkedTaskId]);
  const today = new Date().toISOString().slice(0,10);
  const todaySessions = history.filter(h => h.started_at.slice(0,10) === today && h.type === 'work');
  const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  // Handle custom break
  const handleCustomBreak = () => {
    const duration = breakDurationRef.current?.value?.trim();
    if (!duration) {
      toast.error('Please enter break duration');
      return;
    }
    
    const minutes = parseInt(duration, 10);
    if (isNaN(minutes) || minutes <= 0 || minutes > 120) {
      toast.error('Please enter a valid duration (1-120 minutes)');
      return;
    }
    
    startCustomBreak(minutes);
    setShowBreakInput(false);
    if (breakDurationRef.current) breakDurationRef.current.value = '';
    toast.success(`Started ${minutes} minute break`);
  };

  // Clear session history with confirmation
  const handleClearHistory = () => {
    if (history.length === 0) return;
    const ok = window.confirm('Clear all Pomodoro session history? This cannot be undone.');
    if (!ok) return;
    clearHistory();
    toast.success('Session history cleared');
  };

  // Quick create task handler
  const handleCreateTask = async () => {
    const title = quickTitleRef.current?.value?.trim();
    if (!title) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      createTask({
        title,
        priority: 'medium' as const,
        project_id: selectedProjectId || undefined,
        estimated_duration: 25, // Default to one Pomodoro
        tags: [],
      });

      // Clear form
      if (quickTitleRef.current) quickTitleRef.current.value = '';
      setSelectedProjectId('');
    } catch (error) {
      console.error('Create task error:', error);
    }
  };

  // Start a focus session with the selected task (links it if needed)
  const handleStartWithTask = () => {
    if (!linkedTaskId) {
      toast.error('Please select a task first');
      return;
    }
    const task = tasks.find((t: any) => t.id === linkedTaskId);
    if (!task) {
      toast.error('Selected task not found');
      return;
    }
    // Ensure task is linked
    setLinkedTask(task.id, (task as any).project_id || undefined);
    // Start focus if not already running
    if (!isRunning) start('focus');
    toast.success(`Starting focus with: ${task.title}`);
  };

  // Enhanced mark done - completes task if linked
  const handleMarkDone = async () => {
    if (linkedTaskId && currentTask && currentTask.status !== 'done') {
      try {
        await updateTask(linkedTaskId, { status: 'done' });
        toast.success(`Completed task: ${currentTask.title}`);
      } catch (error) {
        toast.error('Failed to mark task as complete');
        console.error('Update task error:', error);
      }
    }
    markDone(); // Call original mark done
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="col-span-1 xl:col-span-2">
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground mb-2 capitalize">{phase.replace('_', ' ')}</div>
          <div className="text-6xl font-bold tabular-nums mb-6">{formatTime(remainingMs)}</div>
          <div className="flex items-center gap-3 mb-6">
            {isRunning ? (
              <Button size="lg" onClick={pause}><Pause className="w-4 h-4 mr-2"/>Pause</Button>
            ) : (
              <Button size="lg" onClick={() => start()}><Play className="w-4 h-4 mr-2"/>Start</Button>
            )}
            <Button variant="secondary" onClick={reset}><RotateCcw className="w-4 h-4 mr-2"/>Reset</Button>
            <Button variant="outline" onClick={skip}><SkipForward className="w-4 h-4 mr-2"/>Skip</Button>
            <Button variant="outline" onClick={() => addMinute(+1)}><Plus className="w-4 h-4"/></Button>
            <Button variant="outline" onClick={() => addMinute(-1)}><Minus className="w-4 h-4"/></Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowBreakInput(!showBreakInput)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
            >
              <Coffee className="w-4 h-4 mr-2"/>Break
            </Button>
            <Button variant="ghost" onClick={handleMarkDone}><CheckCircle2 className="w-4 h-4 mr-2"/>I'm done</Button>
          </div>
          
          {/* Custom Break Input */}
          {showBreakInput && (
            <div className="w-full max-w-xl p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">Custom Break Duration</div>
              <div className="flex gap-3 items-center">
                <Input 
                  ref={breakDurationRef}
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Enter minutes (1-120)"
                  className="flex-1 border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomBreak();
                    }
                    if (e.key === 'Escape') {
                      setShowBreakInput(false);
                    }
                  }}
                />
                <Button 
                  onClick={handleCustomBreak}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Break
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBreakInput(false)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                >
                  Cancel
                </Button>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Enter break duration and press Enter or click Start Break
              </div>
            </div>
          )}

          <div className="w-full max-w-xl">
            <div className="text-sm font-medium mb-2">Link to task</div>
            <div className="flex gap-3">
              <select
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={linkedTaskId ?? ''}
                onChange={(e) => setLinkedTask(e.target.value || undefined)}
              >
                <option value="">No task</option>
                {tasks.filter((t: any) => t.status !== 'done').map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.status === 'in_progress' ? '(In Progress)' : ''}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={handleStartWithTask} disabled={!linkedTaskId}>
                <Play className="w-4 h-4 mr-2"/>Start with task
              </Button>
            </div>
            {currentTask && (
              <div className="mt-3 space-y-1">
                <div className="text-sm text-muted-foreground">
                  Working on: <span className="font-medium text-foreground">{currentTask.title}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {currentTask.status}
                  </span>
                </div>
                {currentTask.estimated_duration && (
                  <div className="text-xs text-muted-foreground">
                    Estimated: {currentTask.estimated_duration}min
                    {currentTask.actual_duration && ` • Actual: ${currentTask.actual_duration}min`}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick create task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input 
              placeholder="Task title" 
              ref={quickTitleRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTask();
                }
              }}
            />
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button onClick={handleCreateTask} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            Keyboard: Space (start/pause), R (reset), S (skip), +/- (±1 min), B (5min break), Enter (create task)
            <br />Break: Click Break button to set custom break duration
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Session history</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="border-red-300 text-red-600 hover:bg-red-500/10 dark:border-red-800 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2"/>Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">
            Today: {todaySessions.length} focus, {todayMinutes} min
            {phase !== 'focus' && isRunning && (
              <span className="ml-4 text-blue-400">On break: {formatTime(remainingMs)} remaining</span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border scrollbar">
            {history.slice(0,50).map((h) => {
              const linkedTask = tasks.find((t: any) => t.id === h.task_id);
              return (
                <div key={h.id} className="py-2 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="capitalize px-2 py-0.5 rounded bg-accent text-accent-foreground">
                      {h.type.replace('_',' ')}
                    </span>
                    <span className="text-muted-foreground">{new Date(h.started_at).toLocaleTimeString()}</span>
                    {linkedTask && (
                      <span className="text-xs text-blue-400 truncate max-w-32" title={linkedTask.title}>
                        • {linkedTask.title}
                      </span>
                    )}
                  </div>
                  <div className="font-mono">{h.duration}m</div>
                </div>
              );
            })}
            {history.length === 0 && (
              <div className="text-sm text-muted-foreground">No sessions yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PomodoroPage() { return <InnerPomodoroPage />; }


