import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip, Legend, BarChart, Bar } from 'recharts';

export default function AIAnalyticsPage() {
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 30*24*3600*1000).toISOString());
  const [to, setTo] = useState<string>(() => new Date().toISOString());
  const { overview, trends, funnel, cost, isLoading } = useAIAnalytics({ from, to });

  const trendData = useMemo(() => trends ?? [], [trends]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Analytics</h1>
        <p className="text-muted-foreground mt-1">Usage, quality, performance and cost insights for the AI Assistant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="bg-card border rounded-md p-2 text-sm" type="date" value={from.slice(0,10)} onChange={(e)=>setFrom(new Date(e.target.value).toISOString())} />
        <input className="bg-card border rounded-md p-2 text-sm" type="date" value={to.slice(0,10)} onChange={(e)=>setTo(new Date(e.target.value).toISOString())} />
        <div className="text-sm text-muted-foreground flex items-center">Range: {from.slice(0,10)} → {to.slice(0,10)}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Key KPIs for the selected range</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Kpi label="Active Days" value={overview?.dau ?? 0} />
              <Kpi label="Sessions" value={overview?.sessions ?? 0} />
              <Kpi label="Messages" value={overview?.messages ?? 0} />
              <Kpi label="Acceptance Rate" value={Math.round((overview?.acceptanceRate ?? 0)*100)} suffix="%" />
              <Kpi label="Tool Success" value={Math.round((overview?.toolSuccessRate ?? 0)*100)} suffix="%" />
              <Kpi label="p95 Latency" value={overview?.p95LatencyMs ?? 0} suffix="ms" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
          <CardDescription>Users, sessions, messages, acceptance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 text-foreground">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fill: 'currentColor' }} stroke="currentColor" />
                <YAxis allowDecimals={false} tick={{ fill: 'currentColor' }} stroke="currentColor" />
                <ReTooltip wrapperStyle={{ outline: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#60a5fa" name="Users" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sessions" stroke="#22c55e" name="Sessions" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="messages" stroke="#a855f7" name="Messages" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funnel</CardTitle>
          <CardDescription>Proposed → Shown → Accepted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56 text-foreground">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'All', suggested: funnel?.suggested ?? 0, shown: funnel?.shownForConfirmation ?? 0, accepted: funnel?.accepted ?? 0 }] }>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="currentColor" tick={{ fill: 'currentColor' }} />
                <YAxis allowDecimals={false} stroke="currentColor" tick={{ fill: 'currentColor' }} />
                <Legend />
                <ReTooltip wrapperStyle={{ outline: 'none' }} />
                <Bar dataKey="suggested" fill="#3b82f6" name="Suggested" />
                <Bar dataKey="shown" fill="#f59e0b" name="Shown" />
                <Bar dataKey="accepted" fill="#22c55e" name="Accepted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost & Usage</CardTitle>
          <CardDescription>Estimated tokens/characters and cost</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 text-foreground">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cost ?? []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fill: 'currentColor' }} stroke="currentColor" />
                <YAxis allowDecimals={false} tick={{ fill: 'currentColor' }} stroke="currentColor" />
                <ReTooltip wrapperStyle={{ outline: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="input_tokens" stroke="#60a5fa" name="Input" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="output_tokens" stroke="#a855f7" name="Output" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground">{value}{suffix}</div>
    </div>
  );
}


