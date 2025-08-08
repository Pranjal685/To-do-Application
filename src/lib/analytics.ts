import { Task, Project } from '@/types';

export type DateGrouping = 'day' | 'week' | 'month';

export interface TrendPoint {
  key: string; // formatted label
  date: string; // ISO representing the bucket start
  completed: number;
  created: number;
}

export interface OverdueOnTime {
  onTime: number;
  overdue: number;
}

export interface ProjectBreakdownItem {
  id: string;
  name: string;
  value: number;
}

export function getDateRange(days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function isWithinRange(date: Date, start: Date, end: Date) {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function floorTo(date: Date, grouping: DateGrouping) {
  const d = new Date(date);
  if (grouping === 'day') {
    d.setHours(0, 0, 0, 0);
  } else if (grouping === 'week') {
    const day = d.getDay(); // 0=Sun
    const diff = (day + 6) % 7; // make Monday first
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

export function formatKey(date: Date, grouping: DateGrouping) {
  return grouping === 'day'
    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : grouping === 'week'
    ? `Wk ${getWeekNumber(date)}`
    : date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function getWeekNumber(date: Date) {
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
  const week1 = new Date(temp.getFullYear(), 0, 4);
  return (
    1 + Math.round(
      ((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}

export function buildTrend(
  tasks: Task[],
  range: { start: Date; end: Date },
  grouping: DateGrouping
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();

  // Seed buckets within range
  const cursor = new Date(range.start);
  while (cursor <= range.end) {
    const bucket = floorTo(cursor, grouping);
    const key = bucket.toISOString();
    if (!map.has(key)) {
      map.set(key, {
        key: formatKey(bucket, grouping),
        date: bucket.toISOString(),
        completed: 0,
        created: 0,
      });
    }
    // Increment cursor
    if (grouping === 'day') cursor.setDate(cursor.getDate() + 1);
    else if (grouping === 'week') cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const t of tasks) {
    const createdAt = new Date(t.created_at);
    if (isWithinRange(createdAt, range.start, range.end)) {
      const bucket = floorTo(createdAt, grouping);
      const key = bucket.toISOString();
      const point = map.get(key);
      if (point) point.created += 1;
    }
    if (t.status === 'done' && t.completed_at) {
      const completedAt = new Date(t.completed_at);
      if (isWithinRange(completedAt, range.start, range.end)) {
        const bucket = floorTo(completedAt, grouping);
        const key = bucket.toISOString();
        const point = map.get(key);
        if (point) point.completed += 1;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function computeOverdueOnTime(tasks: Task[]): OverdueOnTime {
  return tasks.reduce(
    (acc, t) => {
      if (t.status === 'done' && t.completed_at && t.due_date) {
        const completed = new Date(t.completed_at).getTime();
        const due = new Date(t.due_date).getTime();
        if (completed <= due) acc.onTime += 1;
        else acc.overdue += 1;
      }
      return acc;
    },
    { onTime: 0, overdue: 0 }
  );
}

export function computeAverageDurationMinutes(tasks: Task[]) {
  const durations: number[] = [];
  for (const t of tasks) {
    if (t.status === 'done' && t.completed_at) {
      const start = new Date(t.created_at).getTime();
      const end = new Date(t.completed_at).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        durations.push((end - start) / 60000);
      }
    }
  }
  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

export function computeProjectBreakdown(
  tasks: Task[],
  projects: Project[]
): ProjectBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    const pid = t.project_id || 'none';
    counts.set(pid, (counts.get(pid) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([id, value]) => ({
    id,
    name: id === 'none' ? 'Unassigned' : projects.find((p) => p.id === id)?.name || 'Project',
    value,
  }));
}

export function computeHeatmapMatrix(tasks: Task[]) {
  // 7 (Mon..Sun) x 24 (0..23)
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const t of tasks) {
    if (t.status === 'done' && t.completed_at) {
      const dt = new Date(t.completed_at);
      const day = (dt.getDay() + 6) % 7; // Mon=0
      const hour = dt.getHours();
      matrix[day][hour] += 1;
    }
  }
  const max = matrix.reduce((m, row) => Math.max(m, ...row), 0);
  return { matrix, max };
}

export function filterTasks(
  tasks: Task[],
  projects: Project[],
  rangeDays: number,
  projectId?: string
) {
  const { start, end } = getDateRange(rangeDays);
  const byProject = projectId && projectId !== 'all'
    ? projectId === 'none'
      ? tasks.filter((t) => !t.project_id)
      : tasks.filter((t) => t.project_id === projectId)
    : tasks;
  const inRange = byProject.filter((t) => {
    const createdAt = new Date(t.created_at);
    return isWithinRange(createdAt, start, end) || (t.completed_at ? isWithinRange(new Date(t.completed_at), start, end) : false);
  });
  return { tasks: inRange, start, end };
}

