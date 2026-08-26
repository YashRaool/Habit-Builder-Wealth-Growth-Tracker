import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/analytics/net-worth-history
 * Returns monthly net worth = cumulative income − cumulative expenses + current investments
 * for the last 6 months.
 */
router.get('/net-worth-history', async (req, res) => {
  const uid = req.user.id;
  const months = Number(req.query.months) || 6;

  // Monthly income totals
  const { rows: incomeByMonth } = await pool.query(
    `SELECT to_char(date,'YYYY-MM') AS month, SUM(amount)::numeric AS total
     FROM income_records WHERE user_id=$1
       AND date >= (CURRENT_DATE - ($2||' months')::interval)
     GROUP BY month ORDER BY month`,
    [uid, months]
  );

  // Monthly expense totals
  const { rows: expenseByMonth } = await pool.query(
    `SELECT to_char(date,'YYYY-MM') AS month, SUM(amount)::numeric AS total
     FROM expense_records WHERE user_id=$1
       AND date >= (CURRENT_DATE - ($2||' months')::interval)
     GROUP BY month ORDER BY month`,
    [uid, months]
  );

  // Current investment total (snapshot value)
  const { rows: [invRow] } = await pool.query(
    'SELECT COALESCE(SUM(value),0)::numeric AS total FROM investments WHERE user_id=$1',
    [uid]
  );
  const investmentTotal = Number(invRow.total);

  // Build monthly series
  const incMap = Object.fromEntries(incomeByMonth.map(r => [r.month, Number(r.total)]));
  const expMap = Object.fromEntries(expenseByMonth.map(r => [r.month, Number(r.total)]));

  const series = [];
  let cumulative = 0;
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const inc = incMap[key] || 0;
    const exp = expMap[key] || 0;
    cumulative += (inc - exp);
    series.push({
      month: key,
      income: inc,
      expenses: exp,
      net_cashflow: inc - exp,
      net_worth: cumulative + investmentTotal,
    });
  }

  res.json(series);
});

/**
 * GET /api/analytics/breakdown
 * Returns investment breakdown by type + expense breakdown by category (current month)
 */
router.get('/breakdown', async (req, res) => {
  const uid = req.user.id;

  const { rows: investments } = await pool.query(
    `SELECT type, SUM(value)::numeric AS total
     FROM investments WHERE user_id=$1
     GROUP BY type ORDER BY total DESC`,
    [uid]
  );

  const { rows: expensesByCategory } = await pool.query(
    `SELECT category, SUM(amount)::numeric AS total
     FROM expense_records WHERE user_id=$1
       AND date >= date_trunc('month', CURRENT_DATE)
     GROUP BY category ORDER BY total DESC`,
    [uid]
  );

  // Savings rate: (income - expenses) / income for each of last 6 months
  const { rows: savingsRate } = await pool.query(
    `WITH monthly AS (
       SELECT to_char(d.month, 'YYYY-MM') AS month,
              COALESCE(i.total, 0) AS income,
              COALESCE(e.total, 0) AS expenses
       FROM generate_series(
              date_trunc('month', CURRENT_DATE - interval '5 months'),
              date_trunc('month', CURRENT_DATE),
              interval '1 month'
            ) AS d(month)
       LEFT JOIN (
         SELECT date_trunc('month', date) AS month, SUM(amount)::numeric AS total
         FROM income_records WHERE user_id=$1
         GROUP BY 1
       ) i ON i.month = d.month
       LEFT JOIN (
         SELECT date_trunc('month', date) AS month, SUM(amount)::numeric AS total
         FROM expense_records WHERE user_id=$1
         GROUP BY 1
       ) e ON e.month = d.month
     )
     SELECT month,
            income::numeric,
            expenses::numeric,
            CASE WHEN income > 0 THEN ROUND(((income - expenses) / income * 100)::numeric, 1) ELSE 0 END AS rate
     FROM monthly ORDER BY month`,
    [uid]
  );

  res.json({ investments, expensesByCategory, savingsRate });
});

export default router;
