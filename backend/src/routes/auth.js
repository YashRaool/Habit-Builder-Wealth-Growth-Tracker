import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 12;

/* ── Validation helpers ── */
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* ─────────────────────────────────────────
   POST /api/auth/register
   Body: { name, email, password }
───────────────────────────────────────── */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};

  // Server-side validation
  const errors = [];
  if (!name?.trim())                    errors.push('Name is required');
  if (!email || !isEmail(email))        errors.push('Valid email is required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (errors.length) return res.status(400).json({ errors });

  try {
    // Duplicate check
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ errors: ['An account with that email already exists'] });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase(), password_hash]
    );

    const user  = rows[0];
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ errors: ['Registration failed — please try again'] });
  }
});

/* ─────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
───────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ errors: ['Email and password are required'] });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email=$1',
      [email.toLowerCase()]
    );

    const user = rows[0];
    const valid = user && (await bcrypt.compare(password, user.password_hash));

    if (!valid) {
      return res.status(401).json({ errors: ['Invalid email or password'] });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { password_hash: _, ...safeUser } = user; // strip hash

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ errors: ['Login failed — please try again'] });
  }
});

/* ─────────────────────────────────────────
   GET /api/auth/me  (protected)
───────────────────────────────────────── */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
