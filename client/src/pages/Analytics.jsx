import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import Card from '@/components/Card';

/* ─── Palette ─── */
const CORAL  = '#F2793D';
const MINT   = '#2FA86C';
const ROSE   = '#E2574C';
const INK    = '#16181D';
const MUTED  = '#9CA3AF';
const BORDER = '#E8E5DF';

const PIE_COLORS = [CORAL, MINT, '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', ROSE];
const TYPE_COLORS = { cash: MINT, investment: CORAL, asset: '#6366f1' };
const TYPE_LABELS = { cash: 'Cash', investment: 'Investments', asset: 'Assets' };

const INVESTMENT_TYPES = [
  { value: 'cash',       label: 'Cash / Savings' },
  { value: 'investment', label: 'Stocks / Funds' },
  { value: 'asset',      label: 'Real Estate / Assets' },
];

const fmt  = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtK = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`;
const monthLabel = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

/* ─── Custom tooltip ─── */
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-card-md"
         style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--ink)' }}>{monthLabel(label)}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong>{formatter ? formatter(p.value) : fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

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
            style={{ background: busy ? 'var(--muted)' : CORAL }}
          >
            {busy ? 'Saving…' : 'Save Investment'}
          </button>
        </form>
      </Card>
    </Modal>
  );
}

/* ─── Page ─── */
export default function Analytics() {
  const [history,    setHistory]    = useState([]);
  const [breakdown,  setBreakdown]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, bd] = await Promise.all([
        api.get('/analytics/net-worth-history?months=6'),
        api.get('/analytics/breakdown'),
      ]);
      setHistory(hist);
      setBreakdown(bd);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Derived stats ─── */
  const latestNW   = history.length > 0 ? Number(history[history.length - 1].net_worth) : 0;
  const prevNW     = history.length > 1 ? Number(history[history.length - 2].net_worth) : null;
  const nwDelta    = (prevNW !== null && prevNW !== 0) ? (((latestNW - prevNW) / Math.abs(prevNW)) * 100).toFixed(1) : null;

  const latestRate = breakdown?.savingsRate?.length
    ? Number(breakdown.savingsRate[breakdown.savingsRate.length - 1].rate)
    : 0;

  const totalInvestments = breakdown?.investments?.reduce((s, r) => s + Number(r.total), 0) || 0;

  /* ─── Investment pie data ─── */
  const pieData = useMemo(() =>
    (breakdown?.investments || []).map(r => ({
      name: TYPE_LABELS[r.type] || r.type,
      value: Number(r.total),
      type: r.type,
    })),
    [breakdown]
  );

  /* ─── Expense bar data ─── */
  const expenseData = useMemo(() =>
    (breakdown?.expensesByCategory || []).map(r => ({
      category: r.category,
      total: Number(r.total),
    })),
    [breakdown]
  );

  /* ─── Savings rate data ─── */
  const rateData = useMemo(() =>
    (breakdown?.savingsRate || []).map(r => ({
      month: r.month,
      rate: Number(r.rate),
      income: Number(r.income),
      expenses: Number(r.expenses),
      target: 20,
    })),
    [breakdown]
  );

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <span className="w-10 h-10 rounded-full border-4 animate-spin"
              style={{ borderColor: BORDER, borderTopColor: CORAL }} />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Wealth Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Track how your money grows over time
          </p>
        </div>
        <button
          onClick={() => setShowInvestModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
          style={{ background: CORAL }}
        >
          <span>+</span> Add Investment
        </button>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="p-5">
          <Card.Label>Net Worth</Card.Label>
          <p className="text-stat font-bold mt-1" style={{ color: 'var(--ink)' }}>{fmt(latestNW)}</p>
          {nwDelta !== null ? (
            <Card.Delta direction={Number(nwDelta) >= 0 ? 'up' : 'down'}>
              {Math.abs(Number(nwDelta))}% vs last month
            </Card.Delta>
          ) : (
            <Card.Delta direction="neutral">
              No previous month data
            </Card.Delta>
          )}
        </Card>
        <Card padding="p-5">
          <Card.Label>Portfolio Value</Card.Label>
          <p className="text-stat font-bold mt-1" style={{ color: CORAL }}>{fmt(totalInvestments)}</p>
          <Card.Delta direction="neutral">{pieData.length} asset types</Card.Delta>
        </Card>
        <Card padding="p-5">
          <Card.Label>Savings Rate</Card.Label>
          <p className="text-stat font-bold mt-1" style={{ color: latestRate >= 20 ? MINT : ROSE }}>
            {latestRate}%
          </p>
          <Card.Delta direction={latestRate >= 20 ? 'up' : 'down'}>
            {latestRate >= 20 ? 'On track' : 'Below 20% target'}
          </Card.Delta>
        </Card>
      </div>

      {/* ── Net Worth Over Time ── */}
      <Card padding="p-5" hover={false}>
        <Card.Label>Net Worth Over Time</Card.Label>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <span className="text-3xl">📈</span>
            <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>No net worth history yet</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Log your income and expenses to track your financial growth over time!</p>
          </div>
        ) : (
          <div className="mt-4" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CORAL} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CORAL} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} fontSize={11}
                       stroke={MUTED} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtK} fontSize={11}
                       stroke={MUTED} tickLine={false} axisLine={false} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="net_worth" name="Net Worth"
                      stroke={CORAL} strokeWidth={2.5} fill="url(#nwGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Income vs Expenses ── */}
      <Card padding="p-5" hover={false}>
        <Card.Label>Monthly Income vs Expenses</Card.Label>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <span className="text-3xl">📊</span>
            <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>No income or expense data</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Add cashflow transactions to compare your monthly inflows and outflows.</p>
          </div>
        ) : (
          <div className="mt-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} fontSize={11}
                       stroke={MUTED} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtK} fontSize={11}
                       stroke={MUTED} tickLine={false} axisLine={false} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8}
                        wrapperStyle={{ fontSize: 12, color: MUTED }} />
                <Bar dataKey="income"   name="Income"   fill={MINT}  radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses"  fill={ROSE}  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Two-column: Donut + Expense breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Investment donut */}
        <Card padding="p-5" hover={false}>
          <Card.Label>Portfolio Breakdown</Card.Label>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <span className="text-3xl">📊</span>
              <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>No investments recorded</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Add your assets, cash, or investments to view your portfolio breakdown!</p>
              <button
                onClick={() => setShowInvestModal(true)}
                className="mt-2 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: CORAL }}
              >
                <span>+</span> Add Investment
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center mt-4" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                       cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                       strokeWidth={2} stroke="var(--surface)">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={TYPE_COLORS[entry.type] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)}
                           contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)',
                                          borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8}
                          wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Expense category bars */}
        <Card padding="p-5" hover={false}>
          <Card.Label>Expenses by Category (This Month)</Card.Label>
          {expenseData.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <span className="text-3xl">📭</span>
              <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>No expenses logged this month</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Log your daily spending in Tracker to analyze category breakdown.</p>
            </div>
          ) : (
            <div className="mt-4" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} layout="vertical"
                          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtK} fontSize={11}
                         stroke={MUTED} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="category" fontSize={11} width={90}
                         stroke={MUTED} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => fmt(v)}
                           contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)',
                                          borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="total" name="Spent" fill={ROSE} radius={[0,4,4,0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ── Savings Rate Trend ── */}
      <Card padding="p-5" hover={false}>
        <Card.Label>Savings Rate Trend</Card.Label>
        <p className="text-xs mt-1 mb-3" style={{ color: 'var(--muted)' }}>
          Percentage of income saved each month — aim for 20%+
        </p>
        {rateData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <span className="text-3xl">🎯</span>
            <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>No savings rate history</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Save a portion of your income each month to see your rate trend!</p>
          </div>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} fontSize={11}
                       stroke={MUTED} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 'auto']} tickFormatter={v => `${v}%`} fontSize={11}
                       stroke={MUTED} tickLine={false} axisLine={false} width={45} />
                <Tooltip content={<ChartTooltip formatter={v => `${v}%`} />} />
                {/* 20% target line */}
                <Line type="monotone" dataKey="target" name="Target (20%)"
                      stroke={MUTED} strokeDasharray="6 4" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="rate" name="Savings Rate"
                      stroke={MINT} strokeWidth={2.5} dot={{ r: 4, fill: MINT }}
                      activeDot={{ r: 6, fill: MINT }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Add Investment Modal ── */}
      <AddInvestmentModal
        open={showInvestModal}
        onClose={() => setShowInvestModal(false)}
        onSuccess={fetchData}
      />
    </main>
  );
}
