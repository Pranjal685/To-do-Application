import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Password validation: min 8 chars, at least 1 letter, at least 1 number
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
}

// Fields to return (excludes password)
const userSelectFields = {
  id: true,
  email: true,
  fullName: true,
  preferences: true,
  createdAt: true,
  updatedAt: true,
};

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, full_name } = req.body;

  // Validate password on server side
  const pwdValidation = validatePassword(password);
  if (!pwdValidation.valid) {
    return res.status(400).json({ error: pwdValidation.error });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.profile.create({
      data: {
        email,
        fullName: full_name,
        password: hashedPassword,
        preferences: {},
      },
      select: userSelectFields, // Don't return password
    });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    // Handle unique constraint violation
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: 'Signup failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.profile.findUnique({
      where: { email },
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    res.status(400).json({ error: 'Login failed. Please try again.' });
  }
});

// Logout (client just deletes token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

export default router; 