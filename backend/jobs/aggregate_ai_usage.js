import pool from '../db.js';

function toDateOnly(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function aggregateForDate(targetDate) {
  const model = process.env.AI_MODEL || 'gemini-1.5-flash';
  const dayStart = new Date(targetDate);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000 - 1);

  const users = await pool.query(
    `SELECT COUNT(DISTINCT user_id) AS c FROM ai_events WHERE created_at BETWEEN $1 AND $2`,
    [dayStart, dayEnd]
  );

  const sessions = await pool.query(
    `SELECT COUNT(*) AS c FROM ai_events WHERE type='chat_started' AND created_at BETWEEN $1 AND $2`,
    [dayStart, dayEnd]
  );

  const messages = await pool.query(
    `SELECT COUNT(*) AS c FROM ai_events WHERE type='message_sent' AND created_at BETWEEN $1 AND $2`,
    [dayStart, dayEnd]
  );

  const sugg = await pool.query(
    `SELECT 
      SUM(CASE WHEN type='suggestion_proposed' THEN 1 ELSE 0 END) AS proposed,
      SUM(CASE WHEN type='suggestion_accepted' THEN 1 ELSE 0 END) AS accepted
      FROM ai_events WHERE created_at BETWEEN $1 AND $2`,
    [dayStart, dayEnd]
  );

  const tools = await pool.query(
    `SELECT 
      COUNT(*) AS calls,
      AVG(CASE WHEN status='success' THEN 1 ELSE 0 END)::float AS success_rate,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
     FROM ai_tool_calls WHERE created_at BETWEEN $1 AND $2`,
    [dayStart, dayEnd]
  );

  const inputTokens = 0; // placeholder until token tracking is added
  const outputTokens = 0;
  const costUsd = 0;

  const rowUsers = Number(users.rows[0]?.c || 0);
  const rowSessions = Number(sessions.rows[0]?.c || 0);
  const rowMessages = Number(messages.rows[0]?.c || 0);
  const rowSuggested = Number(sugg.rows[0]?.proposed || 0);
  const rowAccepted = Number(sugg.rows[0]?.accepted || 0);
  const rowToolCalls = Number(tools.rows[0]?.calls || 0);
  const rowToolSuccess = Number(tools.rows[0]?.success_rate || 0);
  const p50 = Math.round(Number(tools.rows[0]?.p50 || 0));
  const p95 = Math.round(Number(tools.rows[0]?.p95 || 0));

  await pool.query(
    `INSERT INTO ai_usage_daily (date, model, users, sessions, messages, suggestions, accepted, tool_calls, tool_success_rate, p50_latency_ms, p95_latency_ms, input_tokens, output_tokens, cost_usd)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (date, model) DO UPDATE SET
      users = EXCLUDED.users,
      sessions = EXCLUDED.sessions,
      messages = EXCLUDED.messages,
      suggestions = EXCLUDED.suggestions,
      accepted = EXCLUDED.accepted,
      tool_calls = EXCLUDED.tool_calls,
      tool_success_rate = EXCLUDED.tool_success_rate,
      p50_latency_ms = EXCLUDED.p50_latency_ms,
      p95_latency_ms = EXCLUDED.p95_latency_ms,
      input_tokens = EXCLUDED.input_tokens,
      output_tokens = EXCLUDED.output_tokens,
      cost_usd = EXCLUDED.cost_usd`,
    [toDateOnly(dayStart), model, rowUsers, rowSessions, rowMessages, rowSuggested, rowAccepted, rowToolCalls, rowToolSuccess, p50, p95, inputTokens, outputTokens, costUsd]
  );
}

export async function backfill(start, end) {
  const startDay = toDateOnly(start);
  const endDay = toDateOnly(end);
  for (let d = new Date(startDay); d <= endDay; d = new Date(d.getTime() + 24 * 3600 * 1000)) {
    // eslint-disable-next-line no-await-in-loop
    await aggregateForDate(d);
  }
}

export default async function scheduleDaily() {
  // Called from index.js after server start
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  await aggregateForDate(yesterday);
}


