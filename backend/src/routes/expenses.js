import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/* GET /api/expenses?page=1&limit=20&category= */
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;
  const offset = (page - 1) * limit;
  const filter = category ? 'AND category=$4' : '';
  const params = category
    ? [req.user.id, limit, offset, category]
    : [req.user.id, limit, offset];

  const { rows } = await pool.query(
    `SELECT * FROM expense_records WHERE user_id=$1 ${filter}
     ORDER BY date DESC LIMIT $2 OFFSET $3`,
    params
  );
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM expense_records WHERE user_id=$1 ${category ? 'AND category=$2' : ''}`,
    category ? [req.user.id, category] : [req.user.id]
  );
  res.json({ data: rows, total: Number(count) });
});

/* GET /api/expenses/summary — totals by category this month */
router.get('/summary', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT category, SUM(amount)::numeric AS total
     FROM expense_records
     WHERE user_id=$1
       AND date >= date_trunc('month', CURRENT_DATE)
     GROUP BY category ORDER BY total DESC`,
    [req.user.id]
  );
  res.json(rows);
});

/* POST /api/expenses */
router.post('/', async (req, res) => {
  const { category, amount, date, note } = req.body;
  if (!category || !amount || !date)
    return res.status(400).json({ errors: ['category, amount, date required'] });
  if (amount <= 0)
    return res.status(400).json({ errors: ['amount must be positive'] });

  const { rows } = await pool.query(
    `INSERT INTO expense_records (user_id, category, amount, date, note)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, category, amount, date, note || null]
  );
  res.status(201).json(rows[0]);
});

/* PUT /api/expenses/:id */
router.put('/:id', async (req, res) => {
  const { category, amount, date, note } = req.body;
  const { rows } = await pool.query(
    `UPDATE expense_records SET category=$1,amount=$2,date=$3,note=$4
     WHERE id=$5 AND user_id=$6 RETURNING *`,
    [category, amount, date, note, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

/* DELETE /api/expenses/:id */
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM expense_records WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

export default router;
