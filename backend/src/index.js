import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRouter       from './routes/auth.js';
import incomeRouter     from './routes/income.js';
import expensesRouter   from './routes/expenses.js';
import habitsRouter     from './routes/habits.js';
import goalsRouter      from './routes/goals.js';
import investmentsRouter from './routes/investments.js';
import feedbackRouter   from './routes/feedback.js';
import adminRouter      from './routes/admin.js';
import analyticsRouter  from './routes/analytics.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── Middleware ── */
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

/* ── Health check ── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

/* ── Routes ── */
app.use('/api/auth',        authRouter);
app.use('/api/income',      incomeRouter);
app.use('/api/expenses',    expensesRouter);
app.use('/api/habits',      habitsRouter);
app.use('/api/goals',       goalsRouter);
app.use('/api/investments',  investmentsRouter);
app.use('/api/feedback',    feedbackRouter);
app.use('/api/admin',       adminRouter);
app.use('/api/analytics',   analyticsRouter);

/* ── 404 fallback ── */
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

/* ── Error handler ── */
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀  API on http://localhost:${PORT}`));

export default app;
