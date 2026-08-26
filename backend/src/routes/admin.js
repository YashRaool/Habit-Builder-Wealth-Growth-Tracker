import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

/* GET /api/admin/stats — aggregate dashboard KPIs */
router.get('/stats', async (req, res) => {
  const [users, activeUsers, income, expenses, habits, habitLogs, goals, feedback] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query(`
      SELECT COUNT(DISTINCT user_id) FROM (
        SELECT user_id FROM income_records
        UNION SELECT user_id FROM expense_records
        UNION SELECT user_id FROM habits
        UNION SELECT user_id FROM savings_goals
      ) AS active_u
    `),
    pool.query('SELECT SUM(amount)::numeric AS total FROM income_records'),
    pool.query('SELECT SUM(amount)::numeric AS total FROM expense_records'),
    pool.query('SELECT COUNT(*) FROM habits'),
    pool.query(`
      SELECT
        COALESCE(ROUND((COUNT(CASE WHEN completed THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 1), 0) AS rate,
        COUNT(*) AS total_logs
      FROM habit_logs
    `),
    pool.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(ROUND(AVG(LEAST(100, (current_amount::numeric / NULLIF(target_amount, 0)) * 100)), 1), 0) AS avg_pct
      FROM savings_goals
    `),
    pool.query("SELECT COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) AS total FROM feedback"),
  ]);

  res.json({
    user_count: Number(users.rows[0].count),
    active_users: Number(activeUsers.rows[0].count),
    total_income: Number(income.rows[0].total || 0),
    total_expenses: Number(expenses.rows[0].total || 0),
    habit_count: Number(habits.rows[0].count),
    habit_completion_rate: Number(habitLogs.rows[0].rate || 0),
    total_habit_logs: Number(habitLogs.rows[0].total_logs || 0),
    goal_count: Number(goals.rows[0].total || 0),
    avg_goal_completion: Number(goals.rows[0].avg_pct || 0),
    feedback_open: Number(feedback.rows[0].open || 0),
    feedback_total: Number(feedback.rows[0].total || 0),
  });
});

/* GET /api/admin/users — paginated user list */
router.get('/users', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(
    `SELECT id, name, email, role, created_at FROM users
     ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const {
    rows: [{ count }],
  } = await pool.query('SELECT COUNT(*) FROM users');
  res.json({ data: rows, total: Number(count) });
});

/* PATCH /api/admin/users/:id/role — change role */
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ errors: ['role must be user|admin'] });
  }

  const { rows } = await pool.query(
    'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role, created_at',
    [role, req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

/* DELETE /api/admin/users/:id — delete user */
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own admin account' });
  }

  const { rowCount } = await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'User not found' });
  res.status(204).end();
});

/* GET /api/admin/feedback — list feedback */
router.get('/feedback', async (req, res) => {
  const { status } = req.query;
  const filter = status ? 'WHERE f.status=$1' : '';
  const params = status ? [status] : [];
  const { rows } = await pool.query(
    `SELECT f.*, u.name AS user_name, u.email AS user_email
     FROM feedback f LEFT JOIN users u ON u.id = f.user_id
     ${filter} ORDER BY f.created_at DESC`,
    params
  );
  res.json(rows);
});

/* PATCH /api/admin/feedback/:id — update feedback status */
router.patch('/feedback/:id', async (req, res) => {
  const { status } = req.body;
  if (!['open', 'resolved'].includes(status)) {
    return res.status(400).json({ errors: ['status must be open|resolved'] });
  }

  const { rows } = await pool.query(
    `UPDATE feedback SET status=$1 WHERE id=$2
     RETURNING *`,
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

export default router;
