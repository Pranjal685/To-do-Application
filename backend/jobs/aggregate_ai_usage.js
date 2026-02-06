import prisma from '../db.js';

function toDateOnly(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function aggregateForDate(targetDate) {
  const model = process.env.AI_MODEL || 'qwen/qwen3-coder:free';
  const dayStart = new Date(targetDate);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000 - 1);

  const users = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT user_id) AS c FROM ai_events WHERE created_at BETWEEN ${dayStart} AND ${dayEnd}
  `;

  const sessions = await prisma.$queryRaw`
    SELECT COUNT(*) AS c FROM ai_events WHERE type='chat_started' AND created_at BETWEEN ${dayStart} AND ${dayEnd}
  `;

  const messages = await prisma.$queryRaw`
    SELECT COUNT(*) AS c FROM ai_events WHERE type='message_sent' AND created_at BETWEEN ${dayStart} AND ${dayEnd}
  `;

  const sugg = await prisma.$queryRaw`
    SELECT 
      SUM(CASE WHEN type='suggestion_proposed' THEN 1 ELSE 0 END) AS proposed,
      SUM(CASE WHEN type='suggestion_accepted' THEN 1 ELSE 0 END) AS accepted
      FROM ai_events WHERE created_at BETWEEN ${dayStart} AND ${dayEnd}
  `;

  const tools = await prisma.$queryRaw`
    SELECT 
      COUNT(*) AS calls,
      AVG(CASE WHEN status='success' THEN 1 ELSE 0 END)::float AS success_rate,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
     FROM ai_tool_calls WHERE created_at BETWEEN ${dayStart} AND ${dayEnd}
  `;

  const inputTokens = 0; // placeholder until token tracking is added
  const outputTokens = 0;
  const costUsd = 0;

  const rowUsers = Number(users[0]?.c || 0);
  const rowSessions = Number(sessions[0]?.c || 0);
  const rowMessages = Number(messages[0]?.c || 0);
  const rowSuggested = Number(sugg[0]?.proposed || 0);
  const rowAccepted = Number(sugg[0]?.accepted || 0);
  const rowToolCalls = Number(tools[0]?.calls || 0);
  const rowToolSuccess = Number(tools[0]?.success_rate || 0);
  const p50 = Math.round(Number(tools[0]?.p50 || 0));
  const p95 = Math.round(Number(tools[0]?.p95 || 0));

  await prisma.$executeRaw`
    INSERT INTO ai_usage_daily (date, model, users, sessions, messages, suggestions, accepted, tool_calls, tool_success_rate, p50_latency_ms, p95_latency_ms, input_tokens, output_tokens, cost_usd)
     VALUES (${toDateOnly(dayStart)}, ${model}, ${rowUsers}, ${rowSessions}, ${rowMessages}, ${rowSuggested}, ${rowAccepted}, ${rowToolCalls}, ${rowToolSuccess}, ${p50}, ${p95}, ${inputTokens}, ${outputTokens}, ${costUsd})
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
      cost_usd = EXCLUDED.cost_usd
  `;
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


