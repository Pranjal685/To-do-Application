import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

// Analytics tracking function
async function logTaskEvent(userId, type, properties) {
  try {
    await pool.query(
      `INSERT INTO ai_events (user_id, type, properties) VALUES ($1, $2, $3::jsonb)`,
      [userId, type, JSON.stringify(properties || {})]
    );
  } catch (e) {
    // Non-fatal: logging should never block core functionality
    console.warn('task_events log failed:', e?.message || e);
  }
}

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

// Get all tasks for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(400).json({ error: err.message });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, due_date, tags, project_id, estimated_duration } = req.body;
    const user_id = req.user.id;
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, priority, user_id, due_date, tags, estimated_duration, created_at, updated_at, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9) RETURNING *',
      [title, description, 'todo', priority, user_id, due_date, tags || [], estimated_duration, project_id]
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
  
  try {
    // Get the current task to compare status changes
    const currentTask = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (currentTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const oldStatus = currentTask.rows[0].status;
    const newStatus = updates.status;
    
    // Update the task
    const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`);
    const values = Object.values(updates);
    values.push(id);
    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING *`,
      [...values]
    );
    
    // Track status change analytics
    if (newStatus && oldStatus !== newStatus) {
      await logTaskEvent(req.user.id, 'task_status_changed', {
        task_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        method: 'drag_drop',
        task_title: currentTask.rows[0].title,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(400).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  res.json({ success: true });
});

// Log Pomodoro session to task
router.post('/:id/pomodoro', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, type, interruptions, completed } = req.body;
    const user_id = req.user.id;
    
    // Verify task ownership
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    
    // Update task's actual_duration if it's a completed focus session
    if (type === 'work' && completed) {
      const newActualDuration = (task.actual_duration || 0) + duration;
      await pool.query(
        'UPDATE tasks SET actual_duration = $1, updated_at = NOW() WHERE id = $2',
        [newActualDuration, id]
      );
    }
    
    res.json({ 
      success: true, 
      message: `Logged ${duration}min ${type} session to task`,
      actualDuration: type === 'work' && completed ? (task.actual_duration || 0) + duration : task.actual_duration
    });
  } catch (err) {
    console.error('Error logging Pomodoro session:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router; 