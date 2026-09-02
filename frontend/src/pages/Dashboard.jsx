import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import StreakGauge from '@/components/StreakGauge';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const curMonthStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

const EXPENSE_CATEGORIES = [
  'Rent', 'Groceries', 'Dining Out', 'Transport', 'Subscriptions',
  'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Savings Transfer', 'Other',
];

const INCOME_SOURCES = [
  'Salary', 'Freelance', 'Side hustle', 'Bonus', 'Investment return', 'Gift', 'Other',
];

const INVESTMENT_TYPES = [
  { value: 'cash',       label: 'Cash / Savings' },
  { value: 'investment', label: 'Stocks / Funds' },
  { value: 'asset',      label: 'Real Estate / Assets' },
];

/* ─── Generic Modal Container ─── */
function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(22,24,29,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div className="w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ─── Quick Add Record Form ─── */
function QuickRecordModal({ type, open, onClose, onSuccess }) {
  const isExpense = type === 'expense';
  const [category, setCategory] = useState(isExpense ? EXPENSE_CATEGORIES[0] : INCOME_SOURCES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(isExpense ? EXPENSE_CATEGORIES[0] : INCOME_SOURCES[0]);
      setAmount('');
      setDate(todayStr());
      setNote('');
      setErrors([]);
    }
  }, [open, isExpense]);

  async function submit(e) {
    e.preventDefault();
    const errs = [];
    if (!amount || Number(amount) <= 0) errs.push('Amount must be positive');
    if (!date) errs.push('Date is required');
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setBusy(true);
    try {
      const endpoint = isExpense ? '/expenses' : '/income';
      const body = isExpense
        ? { category, amount: Number(amount), date, note }
        : { source: category, amount: Number(amount), date, note };
      await api.post(endpoint, body);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors(err.errors || [err.error || 'Save failed']);
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all';
  const inputSt = { background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--ink)' };
  const options = isExpense ? EXPENSE_CATEGORIES : INCOME_SOURCES;

  return (
    <Modal open={open} onClose={onClose}>
      <Card padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
            Quick Add {isExpense ? 'Expense' : 'Income'}
          </h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--muted)' }} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <div>
            <p className="text-label mb-1">{isExpense ? 'Category' : 'Source'}</p>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} style={inputSt}>
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-label mb-1">Amount ($)</p>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
                style={inputSt}
              />
            </div>
            <div>
              <p className="text-label mb-1">Date</p>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputSt} />
            </div>
          </div>

          <div>
            <p className="text-label mb-1">Note (optional)</p>
            <input
              type="text"
              placeholder="Brief description"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
              style={inputSt}
            />
          </div>

          {errors.length > 0 && (
            <ul className="text-xs rounded-lg p-3" style={{ background: 'rgba(226,87,76,0.08)', color: 'var(--rose)' }}>
              {errors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mt-1 transition-all"
            style={{ background: busy ? 'var(--muted)' : isExpense ? 'var(--rose)' : 'var(--mint)' }}
          >
            {busy ? 'Saving…' : `Save ${isExpense ? 'Expense' : 'Income'}`}
          </button>
        </form>
      </Card>
    </Modal>
  );
}

/* ─── Add Investment Modal ─── */
function AddInvestmentModal({ open, onClose, onSuccess }) {
  const [type, setType]     = useState(INVESTMENT_TYPES[0].value);
  const [name, setName]     = useState('');
  const [value, setValue]   = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy]     = useState(false);

  useEffect(() => {
    if (open) { setType(INVESTMENT_TYPES[0].value); setName(''); setValue(''); setErrors([]); }
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    const errs = [];
    if (!name.trim()) errs.push('Name is required');
    if (!value || Number(value) <= 0) errs.push('Value must be positive');
    if (errs.length) { setErrors(errs); return; }
    setBusy(true);
    try {
      await api.post('/investments', { type, name: name.trim(), value: Number(value) });
      onSuccess();
      onClose();
    } catch (err) {
      setErrors(err.errors || [err.error || 'Save failed']);
    } finally { setBusy(false); }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all';
  const inputSt  = { background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--ink)' };

  return (
    <Modal open={open} onClose={onClose}>
      <Card padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
            Add Investment / Asset
          </h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--muted)' }} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <div>
            <p className="text-label mb-1">Type</p>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls} style={inputSt}>
              {INVESTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-label mb-1">Name / Label</p>
            <input
              type="text"
              placeholder="e.g. S&P 500 Index Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              style={inputSt}
            />
          </div>

          <div>
            <p className="text-label mb-1">Value ($)</p>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputCls}
              style={inputSt}
            />
          </div>

          {errors.length > 0 && (
            <ul className="text-xs rounded-lg p-3" style={{ background: 'rgba(226,87,76,0.08)', color: 'var(--rose)' }}>
              {errors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mt-1 transition-all"
            style={{ background: busy ? 'var(--muted)' : 'var(--coral)' }}
          >
            {busy ? 'Saving…' : 'Save Investment'}
          </button>
        </form>
      </Card>
    </Modal>
  );
}

/* ─── Quick Deposit Modal for Savings Goals ─── */
function QuickDepositModal({ goal, open, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setError('');
    }
  }, [open]);

  if (!goal) return null;

  const remaining = Math.max(0, (goal.target_amount || 0) - (goal.current_amount || 0));

  async function submit(e) {
    e.preventDefault();
    const val = Number(amount);
    if (!amount || val <= 0) {
      setError('Amount must be positive');
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/goals/${goal.id}/deposit`, { amount: val });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.errors?.[0] || 'Deposit failed');
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none';
  const inputSt = { background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--ink)' };

  return (
    <Modal open={open} onClose={onClose}>
      <Card padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
            Add deposit to {goal.name}
          </h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--muted)' }} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Target: {fmt(goal.target_amount)} | Saved: {fmt(goal.current_amount)} | Remaining: {fmt(remaining)}
          </p>

          <div>
            <p className="text-label mb-1">Deposit amount ($)</p>
            <input
              type="number"
              min="1"
              step="1"
              autoFocus
              placeholder="e.g. 250"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              style={inputSt}
            />
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--rose)' }}>• {error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mt-1 transition-all"
            style={{ background: busy ? 'var(--muted)' : 'var(--coral)' }}
          >
            {busy ? 'Processing…' : 'Add to savings'}
          </button>
        </form>
      </Card>
    </Modal>
  );
}

/* ───────────────────────────────────────────
   Main Dashboard Component
─────────────────────────────────────────── */
export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState({});
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [quickModal, setQuickModal] = useState(null); // 'expense' | 'income' | null
  const [depositGoal, setDepositGoal] = useState(null); // goal object | null
  const [checkingHabitId, setCheckingHabitId] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);

  /* ── Fetch summary data from all tasks ── */
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [histRes, bdRes, incRes, expRes, habRes, goalRes] = await Promise.all([
        api.get('/analytics/net-worth-history?months=6'),
        api.get('/analytics/breakdown'),
        api.get('/income?limit=200'),
        api.get('/expenses?limit=200'),
        api.get('/habits'),
        api.get('/goals'),
      ]);

      setHistory(histRes || []);
      setBreakdown(bdRes || null);
      setIncomeList(incRes.data || []);
      setExpenseList(expRes.data || []);
      setHabits(habRes || []);
      setGoals(goalRes || []);

      // Fetch logs for habits for today's checkin status
      if (Array.isArray(habRes) && habRes.length > 0) {
        const logEntries = await Promise.all(
          habRes.map(async (h) => {
            try {
              const logs = await api.get(`/habits/${h.id}/logs?days=30`);
              return [h.id, logs];
            } catch {
              return [h.id, []];
            }
          })
        );
        setHabitLogs(Object.fromEntries(logEntries));
      } else {
        setHabitLogs({});
      }
    } catch {
      /* silent retry or handle */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ── Net Worth Calculations (Matches Analytics & Tracker) ── */
  /* ── Net Worth Calculations (Matches Analytics & Tracker) ── */
  const latestNW = history.length > 0 ? Number(history[history.length - 1].net_worth) : 0;
  const prevNW = history.length > 1 ? Number(history[history.length - 2].net_worth) : null;
  const nwDelta = (prevNW !== null && prevNW !== 0) 
    ? (((latestNW - prevNW) / Math.abs(prevNW)) * 100).toFixed(1) 
    : null;

  /* ── Income vs. Expenses This Month (Matches Tracker) ── */
  const curM = curMonthStr();
  const currentMonthIncome = useMemo(
    () =>
      incomeList
        .filter((r) => r.date?.toString().slice(0, 7) === curM)
        .reduce((s, r) => s + Number(r.amount), 0),
    [incomeList, curM]
  );

  const currentMonthExpenses = useMemo(
    () =>
      expenseList
        .filter((r) => r.date?.toString().slice(0, 7) === curM)
        .reduce((s, r) => s + Number(r.amount), 0),
    [expenseList, curM]
  );

  const currentNetCashflow = currentMonthIncome - currentMonthExpenses;
  const savingsRate = currentMonthIncome > 0 ? Number(((currentNetCashflow / currentMonthIncome) * 100).toFixed(1)) : 0;
  const expenseRatio = currentMonthIncome > 0 ? Number(((currentMonthExpenses / currentMonthIncome) * 100).toFixed(1)) : 0;

  /* ── Habit Check-in Action ── */
  async function toggleHabitCheckin(habitId) {
    setCheckingHabitId(habitId);
    try {
      const res = await api.post(`/habits/${habitId}/checkin`);
      // Update habit streak in local habits list
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, current_streak: res.current_streak, longest_streak: res.longest_streak }
            : h
        )
      );

      // Refresh logs for this habit
      const logs = await api.get(`/habits/${habitId}/logs?days=30`);
      setHabitLogs((prev) => ({ ...prev, [habitId]: logs }));
    } catch {
      /* silent */
    } finally {
      setCheckingHabitId(null);
    }
  }

  const today = todayStr();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6 animate-fade-in">
      {/* ── Top Bar / Quick Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
            Financial Overview
          </h1>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setQuickModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--rose)' }}
          >
            <span>+</span> Add Expense
          </button>
          <button
            onClick={() => setQuickModal('income')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--mint)' }}
          >
            <span>+</span> Add Income
          </button>
          <button
            onClick={() => setShowInvestModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--coral)' }}
          >
            <span>+</span> Add Investment
          </button>
          <a
            href="#habits-section"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}
          >
            <span>✓</span> Habit Check-in
          </a>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Loading dashboard metrics…
        </div>
      ) : (
        <>
          {/* ── Row 1: Key Financial Metrics ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Net Worth Card */}
            <Card padding="p-5" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Card.Label>Total Net Worth</Card.Label>
                  <Link to="/analytics" className="text-xs font-semibold hover:underline" style={{ color: 'var(--coral)' }}>
                    Analytics →
                  </Link>
                </div>
                <Card.Stat className="text-3xl">{fmt(latestNW)}</Card.Stat>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {nwDelta !== null ? (
                  <Card.Delta direction={Number(nwDelta) >= 0 ? 'up' : 'down'}>
                    {Math.abs(Number(nwDelta))}% vs last month
                  </Card.Delta>
                ) : (
                  <Card.Delta direction="neutral">
                    No previous month data
                  </Card.Delta>
                )}
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  Cash flow + Investments
                </span>
              </div>
            </Card>

            {/* Income vs Expenses Card */}
            <Card padding="p-5" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Card.Label>Cashflow This Month</Card.Label>
                  <Link to="/tracker" className="text-xs font-semibold hover:underline" style={{ color: 'var(--coral)' }}>
                    Tracker →
                  </Link>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Income: </span>
                    <strong style={{ color: 'var(--mint)' }}>{fmt(currentMonthIncome)}</strong>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Spent: </span>
                    <strong style={{ color: 'var(--rose)' }}>{fmt(currentMonthExpenses)}</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--canvas)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${expenseRatio}%`,
                      background: expenseRatio > 90 ? 'var(--rose)' : 'var(--coral)',
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>Net Savings:</span>
                <span className="font-bold" style={{ color: currentNetCashflow >= 0 ? 'var(--mint)' : 'var(--rose)' }}>
                  {fmt(currentNetCashflow)} ({savingsRate}% rate)
                </span>
              </div>
            </Card>

            {/* Investments Quick Stats */}
            <Card padding="p-5" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Card.Label>Active Investments</Card.Label>
                  <Link to="/analytics" className="text-xs font-semibold hover:underline" style={{ color: 'var(--coral)' }}>
                    View →
                  </Link>
                </div>
                <Card.Stat className="text-3xl">
                  {fmt(breakdown?.investments?.reduce((s, r) => s + Number(r.total), 0) || 0)}
                </Card.Stat>
              </div>
              <div className="mt-4 text-xs flex items-center justify-between" style={{ color: 'var(--muted)' }}>
                <span>Assets portfolio</span>
                <span>{breakdown?.investments?.length || 0} categories</span>
              </div>
            </Card>
          </div>

          {/* ── Row 2: Habit Streaks & Savings Goals ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Habit Streaks Card */}
            <Card padding="p-6" id="habits-section">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
                    Active Habit Streaks
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Check off habits directly from your dashboard
                  </p>
                </div>
                <Link to="/habits" className="text-xs font-semibold hover:underline" style={{ color: 'var(--coral)' }}>
                  All Habits →
                </Link>
              </div>

              {habits.length === 0 ? (
                <p className="text-xs py-6 text-center" style={{ color: 'var(--muted)' }}>
                  No habits added yet. <Link to="/habits" className="underline">Create your first habit</Link>.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {habits.slice(0, 4).map((h) => {
                    const logs = habitLogs[h.id] || [];
                    const todayLog = logs.find((l) => l.date?.toString().slice(0, 10) === today);
                    const isDoneToday = todayLog?.completed === true;
                    const isBusy = checkingHabitId === h.id;

                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-3 rounded-xl transition-all"
                        style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StreakGauge streak={h.current_streak || 0} max={Math.max(h.longest_streak || 30, 30)} size={44} />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>
                              {h.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                              Streak: {h.current_streak || 0} days {h.longest_streak ? `(Best: ${h.longest_streak})` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleHabitCheckin(h.id)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
                          style={{
                            background: isDoneToday ? 'rgba(47,168,108,0.12)' : 'var(--coral)',
                            color: isDoneToday ? 'var(--mint)' : '#fff',
                            border: isDoneToday ? '1.5px solid var(--mint)' : 'none',
                          }}
                        >
                          {isBusy ? (
                            <span
                              className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin inline-block"
                              style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
                            />
                          ) : isDoneToday ? (
                            '✓ Done'
                          ) : (
                            '○ Mark Done'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Savings Goals Progress Card */}
            <Card padding="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
                    Savings Goals Progress
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Track your active wealth growth targets
                  </p>
                </div>
                <Link to="/goals" className="text-xs font-semibold hover:underline" style={{ color: 'var(--coral)' }}>
                  All Goals →
                </Link>
              </div>

              {goals.length === 0 ? (
                <p className="text-xs py-6 text-center" style={{ color: 'var(--muted)' }}>
                  No savings goals set. <Link to="/goals" className="underline">Create a goal</Link>.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {goals.slice(0, 3).map((g) => {
                    const target = Number(g.target_amount) || 1;
                    const current = Number(g.current_amount) || 0;
                    const pct = Math.min(100, Math.round((current / target) * 100));

                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-xl flex flex-col gap-2"
                        style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                            {g.name}
                          </span>
                          <span className="text-xs font-bold" style={{ color: 'var(--coral)' }}>
                            {pct}%
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'var(--coral)' }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs mt-0.5">
                          <span style={{ color: 'var(--muted)' }}>
                            {fmt(current)} of {fmt(target)}
                          </span>
                          <button
                            onClick={() => setDepositGoal(g)}
                            className="font-medium hover:underline text-xs"
                            style={{ color: 'var(--mint)' }}
                          >
                            + Add Deposit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      <QuickRecordModal
        type={quickModal}
        open={Boolean(quickModal)}
        onClose={() => setQuickModal(null)}
        onSuccess={fetchAllData}
      />

      <QuickDepositModal
        goal={depositGoal}
        open={Boolean(depositGoal)}
        onClose={() => setDepositGoal(null)}
        onSuccess={fetchAllData}
      />

      <AddInvestmentModal
        open={showInvestModal}
        onClose={() => setShowInvestModal(false)}
        onSuccess={fetchAllData}
      />
    </main>
  );
}
