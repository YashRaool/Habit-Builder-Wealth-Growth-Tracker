import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/* POST /api/feedback */
router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim())
    return res.status(400).json({ errors: ['message required'] });

  const { rows } = await pool.query(
    `INSERT INTO feedback (user_id, message) VALUES ($1,$2) RETURNING *`,
    [req.user.id, message.trim()]
  );
  res.status(201).json(rows[0]);
});

/* GET /api/feedback — own feedback only */
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM feedback WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

export default router;
