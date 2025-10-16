import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../infra/db/prisma';
import config from '../config';

const router = Router();

// POST /users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(String(password), user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const secret = config.jwtSecret || process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'Server misconfigured' });

    const token = jwt.sign({ email: user.email, id: user.id }, secret, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /users/professionals/search?email=...&query=...
router.get('/professionals/search', async (req, res) => {
  const { email, query } = req.query;
  if (!email || typeof email !== 'string' || !query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Email and query are required' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const professionals = await prisma.professionals.findMany({
      where: {
        user_id: user.id,
        name: { contains: query, mode: 'insensitive' },
        deleted_at: null,
      },
      select: { name: true },
      take: 10,
    });

    return res.json({ professionals: professionals.map(p => p.name) });
  } catch (err) {
    console.error('Search professionals error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
