import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getMonthGrid(reference: Date): Date[] {
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);
  const gridStart = startOfWeek(monthStart);
  const days: Date[] = [];
  let cursor = new Date(gridStart);
  while (days.length < 42) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

export default function Calendar() {
  const { tasks, isLoading } = useTasks();
  const [current, setCurrent] = useState<Date>(new Date());
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [presetDate, setPresetDate] = useState<Date | undefined>(undefined);

  const monthDays = useMemo(() => getMonthGrid(current), [current]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const d = new Date(t.due_date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [tasks]);

  const openCreateForDate = (date?: Date) => {
    setPresetDate(date);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your tasks in calendar format
          </p>
        </div>
        <Button className="flex items-center space-x-2" onClick={() => openCreateForDate(undefined)}>
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </Button>
      </div>

      {/* Calendar Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>{formatMonthYear(current)}</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => setCurrent(addDays(startOfMonth(current), -1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrent(addDays(endOfMonth(current), 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} className="px-2 py-1">{d}</div>
              ))}
            </div>
            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
              {monthDays.map((day, idx) => {
                const inCurrent = day.getMonth() === current.getMonth();
                const isToday = isSameDay(day, new Date());
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayTasks = tasksByDay.get(key) || [];
                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] bg-card p-2 flex flex-col border-0 ${inCurrent ? '' : 'opacity-50'} ${isToday ? 'ring-1 ring-primary' : ''}`}
                    onDoubleClick={() => openCreateForDate(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{day.getDate()}</span>
                      <Button size="sm" className="h-6 w-6 p-0" variant="ghost" onClick={() => openCreateForDate(day)}>+</Button>
                    </div>
                    <div className="space-y-1 overflow-y-auto pr-1">
                      {isLoading && idx === 0 ? (
                        <span className="text-xs text-muted-foreground">Loading…</span>
                      ) : (
                        dayTasks.slice(0, 3).map((t) => (
                          <div key={t.id} title={t.title} className="text-xs truncate px-2 py-1 rounded bg-primary/10 text-primary">
                            {t.title}
                          </div>
                        ))
                      )}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        defaultDueDate={presetDate}
      />
    </div>
  );
}