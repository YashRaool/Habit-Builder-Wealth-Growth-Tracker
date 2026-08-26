import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/* GET /api/income?page=1&limit=20 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(
    `SELECT * FROM income_records WHERE user_id=$1
     ORDER BY date DESC LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );
  const { rows: [{ count }] } = await pool.query(
    'SELECT COUNT(*) FROM income_records WHERE user_id=$1', [req.user.id]
  );
  res.json({ data: rows, total: Number(count) });
});

/* POST /api/income */
router.post('/', async (req, res) => {
  const { source, amount, date, note } = req.body;
  if (!source || !amount || !date)
    return res.status(400).json({ errors: ['source, amount, date required'] });
  if (amount <= 0)
    return res.status(400).json({ errors: ['amount must be positive'] });

  const { rows } = await pool.query(
    `INSERT INTO income_records (user_id, source, amount, date, note)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, source, amount, date, note || null]
  );
  res.status(201).json(rows[0]);
});

/* PUT /api/income/:id */
router.put('/:id', async (req, res) => {
  const { source, amount, date, note } = req.body;
  const { rows } = await pool.query(
    `UPDATE income_records SET source=$1,amount=$2,date=$3,note=$4
     WHERE id=$5 AND user_id=$6 RETURNING *`,
    [source, amount, date, note, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

/* DELETE /api/income/:id */
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM income_records WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

export default router;
