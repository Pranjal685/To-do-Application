import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get current user's profile
router.get('/me', async (req, res) => {
  const id = 1; // DEV: hardcoded admin user id
  const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
  res.json(result.rows[0]);
});

// Update current user's profile
router.put('/me', async (req, res) => {
  const id = 1; // DEV: hardcoded admin user id
  const updates = req.body;
  const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`);
  const values = Object.values(updates);
  values.push(id);
  const result = await pool.query(
    `UPDATE profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    [...values, id]
  );
  res.json(result.rows[0]);
});

export default router; 