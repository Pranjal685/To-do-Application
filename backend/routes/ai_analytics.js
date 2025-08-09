import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
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
  const userId = req.user.id;
  try {
    const dau = await pool.query(
      `SELECT COUNT(DISTINCT date_trunc('day', created_at)) AS days
       FROM ai_events WHERE user_id = $1 AND created_at BETWEEN $2 AND $3`,
      [userId, start, end]
    );
    const sessions = await pool.query(
      `SELECT COUNT(*) FROM ai_events WHERE user_id = $1 AND type = 'chat_started' AND created_at BETWEEN $2 AND $3`,
      [userId, start, end]
    );
    const messages = await pool.query(
      `SELECT COUNT(*) FROM ai_events WHERE user_id = $1 AND type = 'message_sent' AND created_at BETWEEN $2 AND $3`,
      [userId, start, end]
    );
    const acceptance = await pool.query(
      `SELECT 
        SUM(CASE WHEN type = 'suggestion_accepted' THEN 1 ELSE 0 END)::float / NULLIF(SUM(CASE WHEN type IN ('suggestion_accepted','suggestion_rejected') THEN 1 ELSE 0 END),0) AS rate
       FROM ai_events WHERE user_id = $1 AND created_at BETWEEN $2 AND $3`,
      [userId, start, end]
    );
    const toolSuccess = await pool.query(
      `SELECT AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::float AS rate
       FROM ai_tool_calls WHERE user_id = $1 AND created_at BETWEEN $2 AND $3`,
      [userId, start, end]
    );
    const latency = await pool.query(
      `SELECT p95_latency_ms FROM ai_usage_daily WHERE date BETWEEN $1 AND $2 ORDER BY date DESC LIMIT 1`,
      [start, end]
    );
    const cost = await pool.query(
      `SELECT COALESCE(SUM(cost_usd),0) AS cost FROM ai_usage_daily WHERE date BETWEEN $1 AND $2`,
      [start, end]
    );
    res.json({
      dau: Number(dau.rows[0]?.days || 0),
      sessions: Number(sessions.rows[0]?.count || 0),
      messages: Number(messages.rows[0]?.count || 0),
      acceptanceRate: Number(acceptance.rows[0]?.rate || 0),
      toolSuccessRate: Number(toolSuccess.rows[0]?.rate || 0),
      p95LatencyMs: Number(latency.rows[0]?.p95_latency_ms || 0),
      estimatedCostUsd: Number(cost.rows[0]?.cost || 0),
    });
  } catch (err) {
    console.error('overview error', err);
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

router.get('/trends', auth, async (req, res) => {
  const { start, end } = parseRange(req);
  try {
    const r = await pool.query(
      `WITH days AS (
        SELECT generate_series(date_trunc('day', $1::timestamptz), date_trunc('day', $2::timestamptz), interval '1 day') AS d
      )
      SELECT 
        d::date AS date,
        COALESCE((SELECT COUNT(DISTINCT user_id) FROM ai_events e WHERE date_trunc('day', e.created_at) = d), 0) AS users,
        COALESCE((SELECT COUNT(*) FROM ai_events e WHERE date_trunc('day', e.created_at) = d AND e.type = 'chat_started'), 0) AS sessions,
        COALESCE((SELECT COUNT(*) FROM ai_events e WHERE date_trunc('day', e.created_at) = d AND e.type = 'message_sent'), 0) AS messages,
        COALESCE((
          SELECT SUM(CASE WHEN e.type='suggestion_accepted' THEN 1 ELSE 0 END)::float / NULLIF(SUM(CASE WHEN e.type IN ('suggestion_accepted','suggestion_rejected') THEN 1 ELSE 0 END),0)
          FROM ai_events e WHERE date_trunc('day', e.created_at) = d
        ), 0) AS acceptance_rate
      FROM days
      ORDER BY date ASC`,
      [start, end]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('trends error', err);
    res.status(500).json({ error: 'Failed to load trends' });
  }
});

router.get('/funnel', auth, async (req, res) => {
  const { start, end } = parseRange(req);
  try {
    const r = await pool.query(
      `SELECT 
        SUM(CASE WHEN type='suggestion_proposed' THEN 1 ELSE 0 END) AS suggested,
        SUM(CASE WHEN type='suggestion_shown_for_confirmation' THEN 1 ELSE 0 END) AS shown,
        SUM(CASE WHEN type='suggestion_accepted' THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN type='suggestion_rejected' THEN 1 ELSE 0 END) AS declined
       FROM ai_events WHERE created_at BETWEEN $1 AND $2`,
      [start, end]
    );
    const row = r.rows[0] || {};
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
    const r = await pool.query(
      `SELECT EXTRACT(DOW FROM created_at) AS dow, EXTRACT(HOUR FROM created_at) AS hour, COUNT(*)
       FROM ai_events WHERE type='message_sent' AND created_at BETWEEN $1 AND $2
       GROUP BY 1,2`,
      [start, end]
    );
    const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    let max = 0;
    for (const row of r.rows) {
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
    const r = await pool.query(
      `SELECT date, input_tokens, output_tokens, cost_usd FROM ai_usage_daily WHERE date BETWEEN $1 AND $2 ORDER BY date ASC`,
      [start, end]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('cost error', err);
    res.status(500).json({ error: 'Failed to load cost' });
  }
});

export default router;


