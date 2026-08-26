import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/* GET /api/goals */
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM savings_goals WHERE user_id=$1 ORDER BY created_at ASC',
    [req.user.id]
  );
  res.json(rows);
});

/* POST /api/goals */
router.post('/', async (req, res) => {
  const { name, target_amount, current_amount = 0, target_date } = req.body;
  if (!name || !target_amount)
    return res.status(400).json({ errors: ['name and target_amount required'] });
  if (target_amount <= 0)
    return res.status(400).json({ errors: ['target_amount must be positive'] });

  const { rows } = await pool.query(
    `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, name, target_amount, current_amount, target_date || null]
  );
  res.status(201).json(rows[0]);
});

/* PUT /api/goals/:id */
router.put('/:id', async (req, res) => {
  const { name, target_amount, current_amount, target_date } = req.body;
  const { rows } = await pool.query(
    `UPDATE savings_goals
     SET name=$1, target_amount=$2, current_amount=$3, target_date=$4
     WHERE id=$5 AND user_id=$6 RETURNING *`,
    [name, target_amount, current_amount, target_date, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

/* PATCH /api/goals/:id/deposit — add amount to current_amount */
router.patch('/:id/deposit', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0)
    return res.status(400).json({ errors: ['amount must be positive'] });

  const { rows } = await pool.query(
    `UPDATE savings_goals
     SET current_amount = LEAST(current_amount + $1, target_amount)
     WHERE id=$2 AND user_id=$3 RETURNING *`,
    [amount, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

/* DELETE /api/goals/:id */
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM savings_goals WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

export default router;
