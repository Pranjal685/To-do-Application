import express from 'express';
import prisma from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  
  // Dev bypass: accept 'dev' token for development
  if (token === 'dev') {
    req.user = { id: 1, email: 'admin@example.com' };
    return next();
  }
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function parseRange(req) {
  const { from, to } = req.query;
  const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const end = to ? new Date(to) : new Date();
  return { start, end };
}

router.get('/overview', auth, async (req, res) => {
  const { start, end } = parseRange(req);
  const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
  try {
    // Optimized: Single query for events metrics (uses idx_ai_events_user_type_time)
    const eventsMetrics = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT date_trunc('day', created_at)) AS dau,
        COUNT(*) FILTER (WHERE type = 'chat_started') AS sessions,
        COUNT(*) FILTER (WHERE type = 'message_sent') AS messages,
        SUM(CASE WHEN type = 'suggestion_accepted' THEN 1 ELSE 0 END)::float / 
          NULLIF(SUM(CASE WHEN type IN ('suggestion_accepted','suggestion_rejected') THEN 1 ELSE 0 END), 0) AS acceptance_rate
       FROM ai_events 
       WHERE user_id = ${userId} AND created_at BETWEEN ${start} AND ${end}
    `;
    
    // Tool calls metrics (uses idx_ai_tool_calls_user_status_time)
    const toolMetrics = await prisma.$queryRaw`
      SELECT 
        AVG(CASE WHEN status = 'success' THEN 1.0 ELSE 0.0 END) AS success_rate
       FROM ai_tool_calls 
       WHERE user_id = ${userId} AND created_at BETWEEN ${start} AND ${end}
    `;
    
    // Daily aggregates (uses idx_ai_usage_daily_date_model)
    const dailyMetrics = await prisma.$queryRaw`
      SELECT 
        MAX(p95_latency_ms) AS p95_latency_ms,
        COALESCE(SUM(cost_usd), 0) AS cost
       FROM ai_usage_daily 
       WHERE date BETWEEN ${start}::date AND ${end}::date
    `;
    
    const events = eventsMetrics[0] || {};
    const tools = toolMetrics[0] || {};
    const daily = dailyMetrics[0] || {};
    
    res.json({
      dau: Number(events.dau || 0),
      sessions: Number(events.sessions || 0),
      messages: Number(events.messages || 0),
      acceptanceRate: Number(events.acceptance_rate || 0),
      toolSuccessRate: Number(tools.success_rate || 0),
      p95LatencyMs: Number(daily.p95_latency_ms || 0),
      estimatedCostUsd: Number(daily.cost || 0),
    });
  } catch (err) {
    console.error('overview error', err);
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

router.get('/trends', auth, async (req, res) => {
  const { start, end } = parseRange(req);
  try {
    // Optimized: Single aggregation with LEFT JOIN instead of multiple subqueries
    // Uses idx_ai_events_date_trunc for better performance
    const rows = await prisma.$queryRaw`
      WITH date_series AS (
        SELECT generate_series(
          date_trunc('day', ${start}::timestamptz), 
          date_trunc('day', ${end}::timestamptz), 
          interval '1 day'
        )::date AS d
      ),
      event_aggregates AS (
        SELECT 
          date_trunc('day', created_at)::date AS event_date,
          COUNT(DISTINCT user_id) AS users,
          COUNT(*) FILTER (WHERE type = 'chat_started') AS sessions,
          COUNT(*) FILTER (WHERE type = 'message_sent') AS messages,
          SUM(CASE WHEN type = 'suggestion_accepted' THEN 1 ELSE 0 END)::float / 
            NULLIF(SUM(CASE WHEN type IN ('suggestion_accepted','suggestion_rejected') THEN 1 ELSE 0 END), 0) AS acceptance_rate
        FROM ai_events
        WHERE created_at BETWEEN ${start} AND ${end}
        GROUP BY event_date
      )
      SELECT 
        ds.d AS date,
        COALESCE(ea.users, 0) AS users,
        COALESCE(ea.sessions, 0) AS sessions,
        COALESCE(ea.messages, 0) AS messages,
        COALESCE(ea.acceptance_rate, 0) AS acceptance_rate
      FROM date_series ds
      LEFT JOIN event_aggregates ea ON ds.d = ea.event_date
      ORDER BY ds.d ASC
    `;
    res.json(rows);
  } catch (err) {
    console.error('trends error', err);
    res.status(500).json({ error: 'Failed to load trends' });
  }
});

router.get('/funnel', auth, async (req, res) => {
  const { start, end } = parseRange(req);
  try {
    const rows = await prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN type='suggestion_proposed' THEN 1 ELSE 0 END) AS suggested,
        SUM(CASE WHEN type='suggestion_shown_for_confirmation' THEN 1 ELSE 0 END) AS shown,
        SUM(CASE WHEN type='suggestion_accepted' THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN type='suggestion_rejected' THEN 1 ELSE 0 END) AS declined
       FROM ai_events WHERE created_at BETWEEN ${start} AND ${end}
    `;
    const row = rows[0] || {};
    res.json({
      suggested: Number(row.suggested || 0),
      shownForConfirmation: Number(row.shown || 0),
      accepted: Number(row.accepted || 0),
      declined: Number(row.declined || 0),
    });
  } catch (err) {
    console.error('funnel error', err);
    res.status(500).json({ error: 'Failed to load funnel' });
  }
});

router.get('/heatmap', auth, async (req, res) => {
  const { start, end } = parseRange(req);
  try {
    const rows = await prisma.$queryRaw`
      SELECT EXTRACT(DOW FROM created_at) AS dow, EXTRACT(HOUR FROM created_at) AS hour, COUNT(*)
       FROM ai_events WHERE type='message_sent' AND created_at BETWEEN ${start} AND ${end}
       GROUP BY 1,2
    `;
    const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    let max = 0;
    for (const row of rows) {
      const d = Number(row.dow);
      const h = Number(row.hour);
      const c = Number(row.count);
      matrix[d][h] = c;
      if (c > max) max = c;
    }
    res.json({ matrix, max });
  } catch (err) {
    console.error('heatmap error', err);
    res.status(500).json({ error: 'Failed to load heatmap' });
  }
});

router.get('/cost', auth, async (req, res) => {
  const { start, end } = parseRange(req);
  try {
    const rows = await prisma.$queryRaw`
      SELECT date, input_tokens, output_tokens, cost_usd 
      FROM ai_usage_daily 
      WHERE date BETWEEN ${start}::date AND ${end}::date 
      ORDER BY date ASC
    `;
    res.json(rows);
  } catch (err) {
    console.error('cost error', err);
    res.status(500).json({ error: 'Failed to load cost' });
  }
});

export default router;


