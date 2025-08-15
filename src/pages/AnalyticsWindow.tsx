import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Clock, 
  Target, 
  Zap,
  Users,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Activity
} from 'lucide-react';
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
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

// Enhanced color palette with gradients
const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  teal: '#14b8a6',
  orange: '#f97316',
  pink: '#ec4899'
};

type TabType = 'overview' | 'productivity' | 'performance';

const GRADIENTS = {
  primary: 'url(#primaryGradient)',
  secondary: 'url(#secondaryGradient)',
  success: 'url(#successGradient)',
  warning: 'url(#warningGradient)',
  danger: 'url(#dangerGradient)',
  purple: 'url(#purpleGradient)',
  teal: 'url(#tealGradient)',
  orange: 'url(#orangeGradient)',
  pink: 'url(#pinkGradient)'
};

export default function AnalyticsWindow() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { projects } = useProjects();
  
  // Task Analytics State
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [grouping, setGrouping] = useState<DateGrouping>('day');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  
  // AI Analytics State (for overview metrics only)
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 30*24*3600*1000).toISOString());
  const [to, setTo] = useState<string>(() => new Date().toISOString());
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Task Analytics Data
  const { tasks: filtered, start, end } = useMemo(
    () => filterTasks(tasks, projects, rangeDays, projectFilter),
    [tasks, projects, rangeDays, projectFilter]
  );

  const trend = useMemo(() => buildTrend(filtered, { start, end }, grouping), [filtered, start, end, grouping]);
  const overdueVsOnTime = useMemo(() => computeOverdueOnTime(filtered), [filtered]);
  const avgDuration = useMemo(() => computeAverageDurationMinutes(filtered), [filtered]);
  const projectBreakdown = useMemo(() => computeProjectBreakdown(filtered, projects), [filtered, projects]);
  const heatmap = useMemo(() => computeHeatmapMatrix(filtered), [filtered]);

  // AI Analytics Data (simplified for overview only)
  const { overview, isLoading: aiLoading } = useAIAnalytics({ from, to });

  const COLORS = [CHART_COLORS.success, CHART_COLORS.info, CHART_COLORS.purple, CHART_COLORS.warning, CHART_COLORS.danger, CHART_COLORS.teal, CHART_COLORS.orange];

  // Enhanced Analytics Computations
  const productivityScore = useMemo(() => {
    if (filtered.length === 0) return 0;
    const completed = filtered.filter(t => t.status === 'done').length;
    const onTime = overdueVsOnTime.onTime;
    const total = overdueVsOnTime.onTime + overdueVsOnTime.overdue;
    const completionRate = completed / filtered.length;
    const timelinessRate = total > 0 ? onTime / total : 1;
    return Math.round((completionRate * 0.6 + timelinessRate * 0.4) * 100);
  }, [filtered, overdueVsOnTime]);

  const efficiencyTrend = useMemo(() => {
    return trend.map(point => ({
      ...point,
      efficiency: point.created > 0 ? (point.completed / point.created) * 100 : 0
    }));
  }, [trend]);

  const weeklyProductivity = useMemo(() => {
    const weekly = buildTrend(filtered, { start, end }, 'week');
    return weekly.map(point => ({
      ...point,
      productivity: point.completed * 10 + (point.completed / Math.max(point.created, 1)) * 50
    }));
  }, [filtered, start, end]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'productivity', name: 'Productivity', icon: Target },
    { id: 'performance', name: 'Performance', icon: Zap }
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Window</h1>
        <p className="text-muted-foreground mt-1">Comprehensive insights into your productivity and task management patterns</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:text-foreground hover:scale-102'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="bg-card border rounded-md p-2 text-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
          value={rangeDays}
          onChange={(e) => setRangeDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <select
          className="bg-card border rounded-md p-2 text-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
          value={grouping}
          onChange={(e) => setGrouping(e.target.value as DateGrouping)}
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
        <select
          className="bg-card border rounded-md p-2 text-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="all">All projects</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="none">Unassigned</option>
        </select>
        <div className="text-sm text-muted-foreground flex items-center justify-center">
          Range: {new Date(start).toLocaleDateString()} → {new Date(end).toLocaleDateString()}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Key Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Productivity Score"
              value={productivityScore}
              suffix="%"
              icon={Target}
              color="text-green-500"
              description="Overall efficiency"
            />
            <MetricCard
              title="Tasks Completed"
              value={filtered.filter(t => t.status === 'done').length}
              icon={CheckCircle}
              color="text-blue-500"
              description="In selected period"
            />
            <MetricCard
              title="AI Interactions"
              value={overview?.messages ?? 0}
              icon={Brain}
              color="text-purple-500"
              description="AI assistant usage"
            />
            <MetricCard
              title="Avg Duration"
              value={formatDuration(avgDuration)}
              icon={Clock}
              color="text-orange-500"
              description="Per task"
            />
          </div>

          {/* Enhanced Combined Trend Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Productivity Trends</span>
              </CardTitle>
              <CardDescription>
                Task completion and efficiency patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 text-foreground relative">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={efficiencyTrend} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#374151" />
                    <XAxis 
                      dataKey="key" 
                      tick={{ fill: 'currentColor', fontSize: 12 }} 
                      stroke="currentColor" 
                      strokeOpacity={0.3}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left" 
                      allowDecimals={false} 
                      tick={{ fill: 'currentColor', fontSize: 12 }} 
                      stroke="currentColor" 
                      strokeOpacity={0.3}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      allowDecimals={false} 
                      tick={{ fill: 'currentColor', fontSize: 12 }} 
                      stroke="currentColor" 
                      strokeOpacity={0.3}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReTooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="created" 
                      fill={CHART_COLORS.info} 
                      name="Tasks Created" 
                      opacity={0.8}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="completed" 
                      fill={CHART_COLORS.success} 
                      name="Tasks Completed" 
                      opacity={0.8}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke={CHART_COLORS.purple} 
                      name="Efficiency %" 
                      strokeWidth={3} 
                      dot={{ fill: CHART_COLORS.purple, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: CHART_COLORS.purple, strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>AI Assistant Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading AI data...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Kpi label="Active Days" value={overview?.dau ?? 0} />
                    <Kpi label="Messages" value={overview?.messages ?? 0} />
                    <Kpi label="Acceptance Rate" value={Math.round((overview?.acceptanceRate ?? 0)*100)} suffix="%" />
                    <Kpi label="Tool Success" value={Math.round((overview?.toolSuccessRate ?? 0)*100)} suffix="%" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-500/5">
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span>Task Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 text-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'On Time', value: overdueVsOnTime.onTime, fill: CHART_COLORS.success },
                          { name: 'Overdue', value: overdueVsOnTime.overdue, fill: CHART_COLORS.danger }
                        ]} 
                        dataKey="value" 
                        nameKey="name" 
                        outerRadius={60}
                        innerRadius={30}
                        paddingAngle={2}
                      >
                        {[0, 1].map((_, idx) => (
                          <Cell 
                            key={idx} 
                            fill={idx === 0 ? CHART_COLORS.success : CHART_COLORS.danger}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <ReTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {overdueVsOnTime.onTime + overdueVsOnTime.overdue} completed tasks
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {activeTab === 'productivity' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Enhanced Productivity Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Task Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64 text-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="lineGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="lineGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#374151" />
                      <XAxis 
                        dataKey="key" 
                        tick={{ fill: 'currentColor', fontSize: 12 }} 
                        stroke="currentColor" 
                        strokeOpacity={0.3}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fill: 'currentColor', fontSize: 12 }} 
                        stroke="currentColor" 
                        strokeOpacity={0.3}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ReTooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="created" 
                        stroke={CHART_COLORS.info} 
                        name="Created" 
                        strokeWidth={3} 
                        dot={{ fill: CHART_COLORS.info, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: CHART_COLORS.info, strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke={CHART_COLORS.success} 
                        name="Completed" 
                        strokeWidth={3} 
                        dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: CHART_COLORS.success, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <span>Efficiency Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64 text-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={efficiencyTrend} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#374151" />
                      <XAxis 
                        dataKey="key" 
                        tick={{ fill: 'currentColor', fontSize: 12 }} 
                        stroke="currentColor" 
                        strokeOpacity={0.3}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fill: 'currentColor', fontSize: 12 }} 
                        stroke="currentColor" 
                        strokeOpacity={0.3}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ReTooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke={CHART_COLORS.purple} 
                        fill="url(#areaGradient)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500/5 to-cyan-500/5">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-teal-500" />
                  <span>Project Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64 text-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={projectBreakdown} 
                        dataKey="value" 
                        nameKey="name" 
                        outerRadius={90} 
                        innerRadius={50}
                        paddingAngle={2}
                      >
                        {projectBreakdown.map((_, idx) => (
                          <Cell 
                            key={idx} 
                            fill={COLORS[idx % COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <ReTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Productivity Heatmap */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                <span>Productivity Heatmap</span>
              </CardTitle>
              <CardDescription>When you're most productive throughout the week</CardDescription>
            </CardHeader>
            <CardContent>
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
                      const bg = `rgba(99,102,241,${0.1 + intensity * 0.8})`;
                      return (
                        <div 
                          key={h} 
                          className="h-4 rounded transition-all duration-200 hover:scale-110 hover:shadow-md" 
                          title={`${value} completed`} 
                          style={{ backgroundColor: bg }}
                        />
                      );
                    })}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2">Productivity heatmap (Mon → Sun, 0–23h)</div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Project Progress */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500/5 to-emerald-500/5">
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>Current progress across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.length === 0 && (
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                )}
                {projects.slice(0, 6).map((p: any) => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground">{p.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(0, Math.min(100, p.progress))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'performance' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Enhanced Performance Radar Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Performance Overview</span>
              </CardTitle>
              <CardDescription>Multi-dimensional performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                             <div className="h-80 text-foreground">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart data={[
                     {
                       metric: 'Task Completion',
                       value: filtered.length > 0 ? (filtered.filter(t => t.status === 'done').length / filtered.length) * 100 : 0,
                       fullMark: 100,
                     },
                     {
                       metric: 'Timeliness',
                       value: (overdueVsOnTime.onTime + overdueVsOnTime.overdue) > 0 ? 
                         (overdueVsOnTime.onTime / (overdueVsOnTime.onTime + overdueVsOnTime.overdue)) * 100 : 100,
                       fullMark: 100,
                     },
                     {
                       metric: 'AI Acceptance',
                       value: (overview?.acceptanceRate ?? 0) * 100,
                       fullMark: 100,
                     },
                     {
                       metric: 'Tool Success',
                       value: (overview?.toolSuccessRate ?? 0) * 100,
                       fullMark: 100,
                     },
                     {
                       metric: 'Efficiency',
                       value: productivityScore,
                       fullMark: 100,
                     },
                     {
                       metric: 'Engagement',
                       value: overview?.dau ? Math.min(overview.dau * 10, 100) : 0,
                       fullMark: 100,
                     },
                   ]} margin={{ top: 80, right: 80, bottom: 80, left: 80 }}>
                     <defs>
                       <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                         <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                       </linearGradient>
                     </defs>
                     <PolarGrid stroke="#374151" strokeOpacity={0.2} />
                     <PolarAngleAxis 
                       dataKey="metric" 
                       tick={({ payload, x, y, textAnchor, ...props }: any) => {
                         const angle = payload.value;
                         let rotation = 0;
                         let offsetX = 0;
                         let offsetY = 0;
                         
                         // Adjust position based on angle to move labels outward
                         if (angle === 'Task Completion') {
                           rotation = 0;
                           offsetX = 0;
                           offsetY = -15;
                         } else if (angle === 'Timeliness') {
                           rotation = 60;
                           offsetX = 10;
                           offsetY = -10;
                         } else if (angle === 'AI Acceptance') {
                           rotation = 120;
                           offsetX = 10;
                           offsetY = 0;
                         } else if (angle === 'Tool Success') {
                           rotation = 180;
                           offsetX = 0;
                           offsetY = 15;
                         } else if (angle === 'Efficiency') {
                           rotation = 240;
                           offsetX = -10;
                           offsetY = 0;
                         } else if (angle === 'Engagement') {
                           rotation = 300;
                           offsetX = -10;
                           offsetY = -10;
                         }
                         
                         return (
                           <g transform={`translate(${(x || 0) + offsetX}, ${(y || 0) + offsetY})`}>
                             <text
                               x={0}
                               y={0}
                               textAnchor="middle"
                               fill="currentColor"
                               fontSize={14}
                               fontWeight="500"
                               transform={`rotate(${rotation})`}
                             >
                               {angle}
                             </text>
                           </g>
                         );
                       }}
                       tickLine={false}
                     />
                     <PolarRadiusAxis 
                       angle={90} 
                       domain={[0, 100]} 
                       tick={{ fill: 'currentColor', fontSize: 12 }}
                       stroke="#374151"
                       strokeOpacity={0.2}
                       tickLine={false}
                     />
                     <Radar 
                       name="Performance" 
                       dataKey="value" 
                       stroke={CHART_COLORS.primary} 
                       fill="url(#radarGradient)"
                       strokeWidth={3}
                     />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>

          {/* Enhanced Weekly Productivity Analysis */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
              <CardTitle>Weekly Productivity Analysis</CardTitle>
              <CardDescription>Productivity scores by week</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 text-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyProductivity} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#374151" />
                    <XAxis 
                      dataKey="key" 
                      tick={{ fill: 'currentColor', fontSize: 12 }} 
                      stroke="currentColor" 
                      strokeOpacity={0.3}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fill: 'currentColor', fontSize: 12 }} 
                      stroke="currentColor" 
                      strokeOpacity={0.3}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReTooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="productivity" 
                      fill="url(#barGradient)" 
                      name="Productivity Score"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Best Performance Day</span>
                    <span className="text-sm font-medium">
                      {(() => {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayTotals = heatmap.matrix.map((row, i) => ({
                          day: dayNames[i],
                          total: row.reduce((sum, val) => sum + val, 0)
                        }));
                        const bestDay = dayTotals.reduce((max, day) => day.total > max.total ? day : max);
                        return bestDay.total > 0 ? bestDay.day : 'No data';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Hour</span>
                    <span className="text-sm font-medium">
                      {(() => {
                        const hourTotals = heatmap.matrix[0].map((_, hour) => 
                          heatmap.matrix.reduce((sum, row) => sum + row[hour], 0)
                        );
                        const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
                        return peakHour >= 0 ? `${peakHour}:00` : 'No data';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">AI Efficiency</span>
                    <span className="text-sm font-medium">
                      {overview?.acceptanceRate ? `${Math.round(overview.acceptanceRate * 100)}%` : 'No data'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productivityScore < 70 && (
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Improve Productivity</p>
                        <p className="text-xs text-muted-foreground">Focus on task completion and timeliness</p>
                      </div>
                    </div>
                  )}
                  {overdueVsOnTime.overdue > overdueVsOnTime.onTime && (
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Reduce Overdue Tasks</p>
                        <p className="text-xs text-muted-foreground">Set more realistic deadlines</p>
                      </div>
                    </div>
                  )}
                  {(overview?.acceptanceRate ?? 0) < 0.7 && (
                    <div className="flex items-start space-x-2">
                      <Brain className="w-4 h-4 text-purple-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Optimize AI Usage</p>
                        <p className="text-xs text-muted-foreground">Review AI suggestions more carefully</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ title, value, suffix = '', icon: Icon, color, description }: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: any;
  color: string;
  description: string;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold text-foreground">{value}{suffix}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:scale-105 hover:shadow-md">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground">{value}{suffix}</div>
    </div>
  );
}
