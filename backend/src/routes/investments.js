import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/* GET /api/investments */
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM investments WHERE user_id=$1 ORDER BY type, name',
    [req.user.id]
  );
  // Also return net worth summary
  const { rows: [summary] } = await pool.query(
    `SELECT
       SUM(value) FILTER (WHERE type='cash')       AS cash_total,
       SUM(value) FILTER (WHERE type='investment') AS investment_total,
       SUM(value) FILTER (WHERE type='asset')      AS asset_total,
       SUM(value)                                   AS net_worth
     FROM investments WHERE user_id=$1`,
    [req.user.id]
  );
  res.json({ data: rows, summary });
});

/* POST /api/investments */
router.post('/', async (req, res) => {
  const { type, name, value } = req.body;
  if (!type || !name || value == null)
    return res.status(400).json({ errors: ['type, name, value required'] });
  if (!['cash','investment','asset'].includes(type))
    return res.status(400).json({ errors: ['type must be cash|investment|asset'] });

  const { rows } = await pool.query(
    `INSERT INTO investments (user_id, type, name, value)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, type, name, value]
  );
  res.status(201).json(rows[0]);
});

/* PUT /api/investments/:id */
router.put('/:id', async (req, res) => {
  const { type, name, value } = req.body;
  const { rows } = await pool.query(
    `UPDATE investments
     SET type=$1, name=$2, value=$3, updated_at=NOW()
     WHERE id=$4 AND user_id=$5 RETURNING *`,
    [type, name, value, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

/* DELETE /api/investments/:id */
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM investments WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

export default router;
