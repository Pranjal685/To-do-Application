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

// Get current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    // Return mock profile for dev mode if user doesn't exist
    if (userId === 1 && !req.user.email) {
      return res.json({
        id: 1,
        email: 'admin@example.com',
        fullName: 'Admin User',
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update current user's profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    // For dev mode, just return the updated data without saving
    if (userId === 1 && !req.user.email) {
      return res.json({
        id: 1,
        email: 'admin@example.com',
        fullName: req.body.full_name || 'Admin User',
        preferences: req.body.preferences || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const updates = req.body;
    
    // Map frontend field names to Prisma field names
    const data = {};
    if (updates.full_name !== undefined) data.fullName = updates.full_name;
    if (updates.email !== undefined) data.email = updates.email;
    if (updates.preferences !== undefined) data.preferences = updates.preferences;
    
    const profile = await prisma.profile.update({
      where: { id: userId },
      data,
    });
    res.json(profile);
  } catch (err) {
    console.error('Error updating profile:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

export default router; 