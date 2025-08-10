import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
// Using fetch to call OpenRouter directly

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const NO_DB = Boolean(process.env.NO_DB);

async function logEvent(userId, type, properties) {
  if (NO_DB) return;
  try {
    await pool.query(
      `INSERT INTO ai_events (user_id, type, properties) VALUES ($1, $2, $3::jsonb)`,
      [userId, type, JSON.stringify(properties || {})]
    );
  } catch (e) {
    // Non-fatal: logging should never block core functionality
    console.warn('ai_events log failed:', e?.message || e);
  }
}

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

router.post('/chat', auth, async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body || {};

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server' });
  }
  const modelName = process.env.AI_MODEL || 'qwen/qwen3-coder:free';
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  try {
    // Log message event (store only metadata)
    await logEvent(userId, 'message_sent', { length: (message || '').length });

    console.log('[AI Chat] Request →', {
      model: modelName,
      baseURL,
      messageLength: (message || '').length,
    });
    const start = Date.now();
    const resp = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
        'X-Title': process.env.APP_NAME || 'AI Todo',
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'You are an AI task copilot for a productivity app. Be concise. Suggest actionable steps and clarify before destructive changes.' },
          { role: 'user', content: String(message || '') },
        ],
      }),
    });
    const ms = Date.now() - start;
    const completion = await resp.json();
    const text = completion?.choices?.[0]?.message?.content ?? '';
    const usage = completion?.usage || {};

    // Track model usage & latency in events (aggregator will summarize)
    await logEvent(userId, 'assistant_replied', { model: modelName, latency_ms: ms, usage });

    console.log('[AI Chat] Response ←', {
      status: resp.status,
      latencyMs: ms,
      textLength: text.length,
      usage,
    });

    res.json({ text });
  } catch (err) {
    console.error('chat error', err);
    await logEvent(userId, 'safety_blocked', { reason: err?.message?.slice(0, 200) });
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

export default router;


