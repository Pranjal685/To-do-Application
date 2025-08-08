import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import {
  buildTrend,
  computeOverdueOnTime,
  computeAverageDurationMinutes,
  computeProjectBreakdown,
  computeHeatmapMatrix,
  filterTasks,
  type DateGrouping,
} from '@/lib/analytics';
import { formatDuration } from '@/lib/utils';

export default function Analytics() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { projects } = useProjects();

  const [rangeDays, setRangeDays] = useState<number>(30);
  const [grouping, setGrouping] = useState<DateGrouping>('day');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const { tasks: filtered, start, end } = useMemo(
    () => filterTasks(tasks, projects, rangeDays, projectFilter),
    [tasks, projects, rangeDays, projectFilter]
  );

  const trend = useMemo(() => buildTrend(filtered, { start, end }, grouping), [filtered, start, end, grouping]);
  const overdueVsOnTime = useMemo(() => computeOverdueOnTime(filtered), [filtered]);
  const avgDuration = useMemo(() => computeAverageDurationMinutes(filtered), [filtered]);
  const projectBreakdown = useMemo(() => computeProjectBreakdown(filtered, projects), [filtered, projects]);
  const heatmap = useMemo(() => computeHeatmapMatrix(filtered), [filtered]);

  const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your productivity patterns and insights</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          className="bg-card border rounded-md p-2 text-sm"
          value={rangeDays}
          onChange={(e) => setRangeDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <select
          className="bg-card border rounded-md p-2 text-sm"
          value={grouping}
          onChange={(e) => setGrouping(e.target.value as DateGrouping)}
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
        <select
          className="bg-card border rounded-md p-2 text-sm"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="none">Unassigned</option>
        </select>
      </div>

      {/* Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Productivity Dashboard</span>
            </CardTitle>
            <CardDescription>
              Interactive insights from {new Date(start).toLocaleDateString()} to {new Date(end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-center py-20 text-muted-foreground">Loading…</div>
            ) : (
              <div className="space-y-6">
                {/* Row 1: Trend + Overdue */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="h-64 text-foreground">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trend} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                          <XAxis dataKey="key" tick={{ fill: 'currentColor' }} stroke="currentColor" />
                          <YAxis allowDecimals={false} tick={{ fill: 'currentColor' }} stroke="currentColor" />
                          <ReTooltip wrapperStyle={{ outline: 'none' }} />
                          <Legend />
                          <Line type="monotone" dataKey="created" stroke="#60a5fa" name="Created" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="">
                    <div className="h-64 text-foreground">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Tasks', onTime: overdueVsOnTime.onTime, overdue: overdueVsOnTime.overdue }] }>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                          <XAxis dataKey="name" stroke="currentColor" tick={{ fill: 'currentColor' }} />
                          <YAxis allowDecimals={false} stroke="currentColor" tick={{ fill: 'currentColor' }} />
                          <Legend />
                          <ReTooltip wrapperStyle={{ outline: 'none' }} />
                          <Bar dataKey="onTime" stackId="a" fill="#22c55e" name="On time" />
                          <Bar dataKey="overdue" stackId="a" fill="#ef4444" name="Overdue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Average duration: {formatDuration(avgDuration)}</p>
                  </div>
                </div>

                {/* Row 2: Project breakdown + Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="h-64 text-foreground">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={projectBreakdown} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                            {projectBreakdown.map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <ReTooltip wrapperStyle={{ outline: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <div className="grid gap-1">
                      {/* Header hours */}
                      <div
                        className="grid gap-1 text-[10px] text-muted-foreground"
                        style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                      >
                        {Array.from({ length: 24 }).map((_, h) => (
                          <div key={h} className="text-center">{h}</div>
                        ))}
                      </div>
                      {/* Heatmap rows Mon..Sun */}
                      {heatmap.matrix.map((row, dayIdx) => (
                        <div
                          key={dayIdx}
                          className="grid gap-1 items-center"
                          style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                        >
                          {row.map((value, h) => {
                            const intensity = heatmap.max === 0 ? 0 : value / heatmap.max;
                            const bg = `rgba(99,102,241,${0.15 + intensity * 0.75})`;
                            return <div key={h} className="h-4 rounded" title={`${value} completed`} style={{ backgroundColor: bg }} />;
                          })}
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground mt-2">Productivity heatmap (Mon → Sun, 0–23h)</div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Goal / Project progress */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Goals & Project Progress</h3>
                    <div className="space-y-3">
                      {projects.length === 0 && (
                        <p className="text-sm text-muted-foreground">No projects yet.</p>
                      )}
                      {projects.slice(0, 6).map((p) => (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{p.name}</span>
                            <span className="text-muted-foreground">{p.progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded bg-muted">
                            <div
                              className="h-2 rounded bg-primary"
                              style={{ width: `${Math.max(0, Math.min(100, p.progress))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}