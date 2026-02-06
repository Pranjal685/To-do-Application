import express from 'express';
import prisma from '../db.js';
import jwt from 'jsonwebtoken';

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

// Get all projects for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    // Return empty array instead of error for dev mode or if user doesn't exist
    if (req.user?.id === 1 || req.user?.id === '1') {
      return res.json([]);
    }
    res.status(400).json({ error: err.message });
  }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || '#3B82F6',
        userId,
        progress: 0,
      },
    });
    res.json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    
    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id: parseInt(id), userId },
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const data = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.color !== undefined) data.color = updates.color;
    if (updates.progress !== undefined) data.progress = updates.progress;
    
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data,
    });
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    
    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id: parseInt(id), userId },
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await prisma.project.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting project:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

export default router; 