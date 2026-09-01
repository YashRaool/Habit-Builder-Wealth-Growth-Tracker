import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 12;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Explicitly validate that user and password_hash exist before comparison
    if (!user || !user.password_hash) {
      return res.status(401).json({ errors: ['Invalid email or password'] });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

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
   POST /api/auth/google
   Body: { credential }
───────────────────────────────────────── */
router.post('/google', async (req, res) => {
  const { credential } = req.body ?? {};

  if (!credential) {
    return res.status(400).json({ errors: ['Google credential is required'] });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload.email_verified) {
      return res.status(403).json({ errors: ['Google email not verified'] });
    }

    const { email, name, sub: googleId } = payload;
    const lowerEmail = email.toLowerCase();

    // Find existing user by google_id or email
    let { rows } = await pool.query(
      'SELECT id, name, email, role, google_id, auth_provider FROM users WHERE google_id = $1 OR email = $2',
      [googleId, lowerEmail]
    );

    let user = rows[0];

    if (user) {
      // Link account if email matches but google_id is not set
      if (!user.google_id) {
        const { rows: updateRows } = await pool.query(
          `UPDATE users SET google_id = $1, auth_provider = 'google_linked' WHERE id = $2 RETURNING id, name, email, role, google_id, auth_provider`,
          [googleId, user.id]
        );
        user = updateRows[0];
      } else if (user.google_id !== googleId) {
        return res.status(403).json({ errors: ['Email is associated with a different Google account'] });
      }
    } else {
      // Create new user
      const { rows: createRows } = await pool.query(
        `INSERT INTO users (name, email, google_id, auth_provider, password_hash)
         VALUES ($1, $2, $3, 'google', NULL)
         RETURNING id, name, email, role, created_at, google_id, auth_provider`,
        [name, lowerEmail, googleId]
      );
      user = createRows[0];
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { password_hash: _, ...safeUser } = user; // strip hash if present

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('google auth error', err);
    res.status(401).json({ errors: ['Invalid Google token'] });
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
