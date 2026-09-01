import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/* ── GET /api/habits ── */
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM habits WHERE user_id=$1 ORDER BY created_at ASC',
    [req.user.id]
  );
  res.json(rows);
});

/* ── POST /api/habits ── */
router.post('/', async (req, res) => {
  const { name, frequency = 'daily' } = req.body;
  if (!name?.trim()) return res.status(400).json({ errors: ['name required'] });
  if (!['daily','weekly','monthly'].includes(frequency))
    return res.status(400).json({ errors: ['frequency must be daily|weekly|monthly'] });

  const { rows } = await pool.query(
    `INSERT INTO habits (user_id, name, frequency)
     VALUES ($1,$2,$3) RETURNING *`,
    [req.user.id, name.trim(), frequency]
  );
  res.status(201).json(rows[0]);
});

/* ── PUT /api/habits/:id ── */
router.put('/:id', async (req, res) => {
  const { name, frequency } = req.body;
  const { rows } = await pool.query(
    `UPDATE habits SET name=$1, frequency=$2
     WHERE id=$3 AND user_id=$4 RETURNING *`,
    [name, frequency, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

/* ── DELETE /api/habits/:id ── */
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM habits WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

/* ────────────────────────────────────────────
   Habit Log sub-resource
──────────────────────────────────────────── */

/* GET /api/habits/:id/logs?days=30 */
router.get('/:id/logs', async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 365);
  const { rows } = await pool.query(
    `SELECT hl.* FROM habit_logs hl
     JOIN habits h ON h.id = hl.habit_id
     WHERE hl.habit_id=$1 AND h.user_id=$2
       AND hl.date >= CURRENT_DATE - $3::int
     ORDER BY hl.date DESC`,
    [req.params.id, req.user.id, days]
  );
  res.json(rows);
});

/* POST /api/habits/:id/checkin  — toggle today's completion */
router.post('/:id/checkin', async (req, res) => {
  const habitId = req.params.id;
  const today   = new Date().toISOString().slice(0, 10);

  // Verify ownership
  const { rows: [habit] } = await pool.query(
    'SELECT * FROM habits WHERE id=$1 AND user_id=$2',
    [habitId, req.user.id]
  );
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  // Upsert today's log
  const { rows: [log] } = await pool.query(
    `INSERT INTO habit_logs (habit_id, date, completed)
     VALUES ($1, $2, true)
     ON CONFLICT (habit_id, date)
     DO UPDATE SET completed = NOT habit_logs.completed
     RETURNING *`,
    [habitId, today]
  );

  // Recalculate streak
  const { rows: logs } = await pool.query(
    `SELECT date, completed FROM habit_logs
     WHERE habit_id=$1 ORDER BY date DESC`,
    [habitId]
  );

  const getWeekStr = (d) => {
    const date = new Date(d.getTime());
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (date - yearStart) / 86400000) + 1)/7);
    return `${date.getUTCFullYear()}-W${weekNo}`;
  };
  const getMonthStr = (d) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;

  let streak = 0;
  if (habit.frequency === 'daily') {
    let d = new Date(today);
    for (const l of logs) {
      if (l.date.toISOString().slice(0,10) === d.toISOString().slice(0,10) && l.completed) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (l.date.toISOString().slice(0,10) < d.toISOString().slice(0,10)) {
        break;
      }
    }
  } else {
    let currentPeriod = habit.frequency === 'weekly' ? getWeekStr(new Date(today)) : getMonthStr(new Date(today));
    let d = new Date(today);
    
    const periods = [];
    for (const l of logs) {
      if (!l.completed) continue;
      const p = habit.frequency === 'weekly' ? getWeekStr(l.date) : getMonthStr(l.date);
      if (periods.length === 0 || periods[periods.length - 1] !== p) {
        periods.push(p);
      }
    }
    
    for (const p of periods) {
      if (p === currentPeriod) {
        streak++;
        if (habit.frequency === 'weekly') {
          d.setUTCDate(d.getUTCDate() - 7);
          currentPeriod = getWeekStr(d);
        } else {
          d.setUTCMonth(d.getUTCMonth() - 1);
          currentPeriod = getMonthStr(d);
        }
      } else {
        break;
      }
    }
  }

  const longest = Math.max(habit.longest_streak, streak);
  await pool.query(
    'UPDATE habits SET current_streak=$1, longest_streak=$2 WHERE id=$3',
    [streak, longest, habitId]
  );

  res.json({ log, current_streak: streak, longest_streak: longest });
});

export default router;
