import express from 'express';
import prisma from '../db.js';
import jwt from 'jsonwebtoken';

// Analytics tracking function
async function logTaskEvent(userId, type, properties) {
  try {
    await prisma.aiEvent.create({
      data: {
        userId,
        type,
        properties: properties || {},
      },
    });
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
  const token = auth.split(' ')[1];
  
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

// Get all tasks for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    // Return empty array instead of error for dev mode or if user doesn't exist
    if (req.user?.id === 1 || req.user?.id === '1') {
      return res.json([]);
    }
    res.status(400).json({ error: err.message });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, due_date, tags, project_id, estimated_duration } = req.body;
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: 'todo',
        priority: priority || 'medium',
        userId,
        dueDate: due_date ? new Date(due_date) : null,
        tags: tags || [],
        estimatedDuration: estimated_duration,
        projectId: project_id || null,
      },
    });
    res.json(task);
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
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const currentTask = await prisma.task.findFirst({
      where: { id: parseInt(id), userId },
    });
    
    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const oldStatus = currentTask.status;
    const newStatus = updates.status;
    
    // Map frontend field names to Prisma field names
    const data = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.due_date !== undefined) data.dueDate = updates.due_date ? new Date(updates.due_date) : null;
    if (updates.tags !== undefined) data.tags = updates.tags;
    if (updates.project_id !== undefined) data.projectId = updates.project_id || null;
    if (updates.estimated_duration !== undefined) data.estimatedDuration = updates.estimated_duration;
    if (updates.actual_duration !== undefined) data.actualDuration = updates.actual_duration;
    if (updates.completed_at !== undefined) data.completedAt = updates.completed_at ? new Date(updates.completed_at) : null;
    
    // Set completed_at automatically when status changes to 'done'
    if (newStatus === 'done' && oldStatus !== 'done') {
      data.completedAt = new Date();
    } else if (newStatus !== 'done' && oldStatus === 'done') {
      data.completedAt = null;
    }
    
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data,
    });
    
    // Track status change analytics
    if (newStatus && oldStatus !== newStatus) {
      await logTaskEvent(userId, 'task_status_changed', {
        task_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        method: 'drag_drop',
        task_title: currentTask.title,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null
      });
    }
    
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Verify ownership before deleting
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const task = await prisma.task.findFirst({
      where: { id: parseInt(id), userId },
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await prisma.task.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting task:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Log Pomodoro session to task
router.post('/:id/pomodoro', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, type, interruptions, completed } = req.body;
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    
    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: parseInt(id), userId },
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update task's actual_duration if it's a completed focus session
    let actualDuration = task.actualDuration;
    if (type === 'work' && completed) {
      actualDuration = (task.actualDuration || 0) + duration;
      await prisma.task.update({
        where: { id: parseInt(id) },
        data: { actualDuration },
      });
    }
    
    res.json({ 
      success: true, 
      message: `Logged ${duration}min ${type} session to task`,
      actualDuration
    });
  } catch (err) {
    console.error('Error logging Pomodoro session:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router; 