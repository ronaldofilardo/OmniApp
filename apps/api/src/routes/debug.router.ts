import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

const router = Router();

// Rota de desenvolvimento que gera um token para o REQUIRED_USER_EMAIL
router.get('/dev-token', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }

  const email = process.env.REQUIRED_USER_EMAIL || 'user@email.com';
  const secret = config.jwtSecret || process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: 'JWT secret not configured' });

  const token = jwt.sign({ email }, secret, { expiresIn: '7d' });
  return res.json({ token, email });
});

export default router;