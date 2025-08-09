import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

router.post('/chat', auth, async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body || {};

  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured on server' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction:
      'You are an AI task copilot for a productivity app. Be concise. Suggest actionable steps and clarify before destructive changes.',
  });

  try {
    // Log message event (store only metadata)
    await pool.query(
      `INSERT INTO ai_events (user_id, type, properties) VALUES ($1, $2, $3::jsonb)`,
      [userId, 'message_sent', JSON.stringify({ length: (message || '').length })]
    );

    const start = Date.now();
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: String(message || '') }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    });
    const ms = Date.now() - start;

    const text = result?.response?.text?.() ?? '';
    const usage = result?.response?.usageMetadata || {};

    // Track model usage & latency in events (aggregator will summarize)
    await pool.query(
      `INSERT INTO ai_events (user_id, type, properties) VALUES ($1, $2, $3::jsonb)`,
      [
        userId,
        'assistant_replied',
        JSON.stringify({ model: modelName, latency_ms: ms, usage }),
      ]
    );

    res.json({ text });
  } catch (err) {
    console.error('chat error', err);
    await pool.query(
      `INSERT INTO ai_events (user_id, type, properties) VALUES ($1, $2, $3::jsonb)`,
      [userId, 'safety_blocked', JSON.stringify({ reason: err?.message?.slice(0, 200) })]
    ).catch(() => {});
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

export default router;


