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

// Get all tasks for user
router.get('/', async (req, res) => {
  const id = 1; // DEV: hardcoded admin user id
  const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [id]);
  res.json(result.rows);
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, due_date, tags, project_id } = req.body;
    const user_id = req.user.id;
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, priority, user_id, due_date, tags, created_at, updated_at, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8) RETURNING *',
      [title, description, 'todo', priority, user_id, due_date, tags || [], project_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`);
  const values = Object.values(updates);
  values.push(id);
  values.push(req.user.id);
  const result = await pool.query(
    `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING *`,
    [...values]
  );
  res.json(result.rows[0]);
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  res.json({ success: true });
});

export default router; 