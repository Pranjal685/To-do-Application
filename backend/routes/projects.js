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

// Get all projects for user
router.get('/', async (req, res) => {
  const id = 1; // DEV: hardcoded admin user id
  const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [id]);
  res.json(result.rows);
});

// Create project
router.post('/', async (req, res) => {
  const { name, description, color } = req.body;
  const user_id = 1; // DEV: hardcoded admin user id
  const result = await pool.query(
    'INSERT INTO projects (name, description, color, user_id, progress, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
    [name, description, color, user_id, 0]
  );
  res.json(result.rows[0]);
});

// Update project
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`);
  const values = Object.values(updates);
  values.push(id);
  const result = await pool.query(
    `UPDATE projects SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    [...values, id]
  );
  res.json(result.rows[0]);
});

// Delete project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  res.json({ success: true });
});

export default router; 