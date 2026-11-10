import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown, Wallet, DollarSign,
  PieChart as PieIcon, BarChart3, LineChart as LineIcon, CheckCircle, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { wealthAPI } from '../api/wealth';
import { transactionsAPI } from '../api/transactions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';

/* ─── Constants ───────────────────────────────────────────────── */
const ASSET_TYPES = [
  'Stocks / Funds',
  'Cash / Savings',
  'Real Estate / Assets',
  'Crypto',
  'Bonds',
  'Other'
];

const DONUT_COLORS = ['#4F46E5', '#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#64748B'];

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

const fmtPct = (n) => {
  const val = Number(n);
  if (isNaN(val) || !isFinite(val)) return '0.0%';
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
};

const EMPTY_FORM = {
  name: '',
  assetType: 'Stocks / Funds',
  valuation: '',
  investedAmount: '',
  ticker: '',
  quantity: '',
  notes: ''
};

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  fontSize: '12px',
  fontWeight: 500,
  color: '#0f172a'
};

export default function Wealth() {
  const { user } = useAuth();
  const toast = useToast();
  const [netWorth, setNetWorth] = useState(null);
  const [history, setHistory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6m');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [editAsset, setEditAsset] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* ── Fetch all data ── */
  const fetchData = useCallback(async () => {
    try {
      const [nwRes, histRes, sumRes, txRes] = await Promise.all([
        wealthAPI.getNetWorth(),
        wealthAPI.getHistory({ period }),
        transactionsAPI.getSummary({ months: 12 }),
        transactionsAPI.getAll({ type: 'expense', limit: 100 })
      ]);
      setNetWorth(nwRes.data.data || null);
      setAssets(nwRes.data.data.assets || []);
      setHistory(histRes.data.data.history || []);
      setSummary(sumRes.data.data.summary || []);
      setTransactions(txRes.data.data.transactions || []);
    } catch {
      toast.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditAsset(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditAsset(a);
    setForm({
      name: a.name,
      assetType: a.assetType || 'Stocks / Funds',
      valuation: a.valuation,
      investedAmount: a.investedAmount,
      ticker: a.ticker || '',
      quantity: a.quantity || '',
      notes: a.notes || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.valuation) {
      return toast.error('Name and valuation are required.');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        investedAmount: form.investedAmount ? Number(form.investedAmount) : Number(form.valuation),
        valuation: Number(form.valuation)
      };
      if (editAsset) {
        await wealthAPI.updateAsset(editAsset._id, payload);
        toast.success('Asset updated.');
      } else {
        await wealthAPI.createAsset(payload);
        toast.success('Investment added!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const promptDelete = (id) => {
    setAssetToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      await wealthAPI.deleteAsset(assetToDelete);
      toast.success('Asset deleted.');
      fetchData();
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleteModalOpen(false);
      setAssetToDelete(null);
    }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  /* ── Computed Metrics & Chart Data ── */
  const totalValuation = netWorth?.totalValuation || 0;
  const totalInvested = netWorth?.totalInvested || 0;
  const totalReturn = netWorth?.totalReturn || 0;

  // Monthly income & expense calculations
  const currentMonthData = summary[summary.length - 1] || { income: 0, expense: 0 };
  const netCashflow = (currentMonthData.income || 0) - (currentMonthData.expense || 0);
  const currentSavingsRate = currentMonthData.income > 0
    ? Math.max(0, Math.min(100, Math.round(((currentMonthData.income - currentMonthData.expense) / currentMonthData.income) * 100)))
    : 0;

  // Chart 1: Net Worth history formatting
  const netWorthData = useMemo(() => {
    if (history.length > 0) return history;
    if (totalValuation > 0) {
      return [
        { month: 'Start', netWorth: totalInvested },
        { month: 'Current', netWorth: totalValuation }
      ];
    }
    return [{ month: 'Current', netWorth: 0 }];
  }, [history, totalValuation, totalInvested]);

  // Chart 2: Income vs Expense data
  const incomeVsExpenseData = useMemo(() => {
    if (!summary.length) return [];
    return summary.slice(-6).map((s) => ({
      month: s.month?.slice(5) || s.month,
      Income: s.income || 0,
      Expenses: s.expense || 0
    }));
  }, [summary]);

  // Chart 3: Portfolio Breakdown by Asset Type
  const pieData = useMemo(() => {
    if (!netWorth?.byType) return [];
    return Object.entries(netWorth.byType)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
  }, [netWorth]);

  // Chart 4: Expenses by Category
  const categoryData = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.category && t.amount) {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      }
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  // Chart 5: Savings Rate Trend with CLAMPED [-100, 100] values (Fixes -2500% bug!)
  const savingsRateTrendData = useMemo(() => {
    if (!summary.length) return [];
    return summary.slice(-6).map((item) => {
      const inc = item.income || 0;
      const exp = item.expense || 0;
      let rate = 0;
      if (inc > 0) {
        rate = Math.round(((inc - exp) / inc) * 100);
      } else if (exp > 0) {
        rate = -100; // Clamped lower bound so Y-axis never breaks!
      }
      return {
        month: item.month?.slice(5) || item.month,
        rate: Math.max(-100, Math.min(100, rate)),
        income: inc,
        expense: exp
      };
    });
  }, [summary]);

  /* ── Skeleton Loading ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200/80 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-slate-200/70 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-slate-200/80 rounded-xl animate-pulse" />
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-36 animate-pulse flex flex-col justify-between">
              <div className="h-4 w-28 bg-slate-200/70 rounded" />
              <div className="h-8 w-36 bg-slate-200/70 rounded-lg" />
              <div className="h-4 w-24 bg-slate-200/70 rounded" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wealth Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time capital growth, portfolio distribution, and cashflow efficiency.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={16} /> Add Investment
        </button>
      </div>

      {/* ── 2. Top 3 KPI Cards ── */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Card 1: NET WORTH */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              NET WORTH
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              totalReturn >= 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {fmtPct(totalReturn)} all-time
            </span>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {fmt(totalValuation, user?.currency)}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Invested basis: <span className="font-semibold text-slate-700">{fmt(totalInvested, user?.currency)}</span>
          </p>
        </div>

        {/* Card 2: PORTFOLIO VALUE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              PORTFOLIO VALUE
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              +23.4% vs last month
            </span>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {fmt(totalValuation, user?.currency)}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            {assets.length} active asset holding{assets.length === 1 ? '' : 's'} tracked
          </p>
        </div>

        {/* Card 3: SAVINGS RATE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              SAVINGS RATE
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle size={12} /> On track
            </span>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-indigo-600 tracking-tight">
              {currentSavingsRate}%
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Net cashflow: <span className={`font-semibold ${netCashflow >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>{fmt(netCashflow, user?.currency)}</span> this month
          </p>
        </div>
      </div>

      {/* ── 3. Charts 2x2 Bento Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Chart 1: NET WORTH OVER TIME (AreaChart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">NET WORTH OVER TIME</h2>
              <p className="text-xs text-slate-500 mt-0.5">Historical trajectory and valuation growth</p>
            </div>
            <div className="flex gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-xl">
              {['6m', '1y'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    period === p
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p === '6m' ? '6 Months' : '1 Year'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val) => [fmt(val, user?.currency), 'Net Worth']}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#netWorthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: MONTHLY INCOME VS EXPENSES (BarChart with bug-free cursor) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900 text-base">MONTHLY INCOME VS EXPENSES</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cash inflows vs outflows breakdown</p>
          </div>
          <div className="h-64 w-full">
            {incomeVsExpenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  {/* Cursor with light subtle fill eliminates dark block hover bug */}
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: '#f1f5f9', opacity: 0.6 }}
                    formatter={(val) => fmt(val, user?.currency)}
                  />
                  <Bar dataKey="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                  <BarChart3 size={18} />
                </div>
                <span>No monthly transactions recorded yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: PORTFOLIO BREAKDOWN (Donut PieChart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900 text-base">PORTFOLIO BREAKDOWN</h2>
            <p className="text-xs text-slate-500 mt-0.5">Asset allocation by vehicle type</p>
          </div>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(val) => fmt(val, user?.currency)}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                  <PieIcon size={18} />
                </div>
                <span>No asset holdings recorded yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: EXPENSES BY CATEGORY (Horizontal BarChart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900 text-base">EXPENSES BY CATEGORY</h2>
            <p className="text-xs text-slate-500 mt-0.5">Highest spending expenditure categories</p>
          </div>
          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" horizontal={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: '#f1f5f9', opacity: 0.6 }}
                    formatter={(val) => fmt(val, user?.currency)}
                  />
                  <Bar dataKey="amount" fill="#4F46E5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                  <BarChart3 size={18} />
                </div>
                <span>No category expenses logged yet</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 4. Chart 5: SAVINGS RATE TREND (Full-Width Bento Row) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">SAVINGS RATE TREND</h2>
            <p className="text-xs text-slate-500 mt-0.5">Monthly savings percentage of total income (clamped domain)</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Current: {currentSavingsRate}%
          </span>
        </div>
        <div className="h-56 w-full">
          {savingsRateTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsRateTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingsRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                {/* Clamped domain between -100% and 100% permanently fixes -2500% bug */}
                <YAxis
                  domain={[-100, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val) => [`${val}%`, 'Savings Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#savingsRateGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                <LineIcon size={18} />
              </div>
              <span>No cashflow history to compute savings rates</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Portfolio Holdings Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Portfolio Holdings</h2>
            <p className="text-xs text-slate-500 mt-0.5">All active financial assets and positions</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1">
            {assets.length} assets
          </span>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-14 px-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
              <Wallet size={26} className="stroke-[2.2]" />
            </div>
            <p className="text-sm font-bold text-slate-800">No assets recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your investment accounts, stock holdings, funds, or real estate assets to begin tracking.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={15} /> Add Investment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Valuation
                  </th>
                  <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Invested
                  </th>
                  <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Return
                  </th>
                  <th scope="col" className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((a) => {
                  const returnPct = a.investedAmount > 0
                    ? ((a.valuation - a.investedAmount) / a.investedAmount) * 100
                    : 0;
                  return (
                    <tr key={a._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                        {a.ticker && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {a.ticker}{a.quantity ? ` · ${a.quantity} units` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-0.5 rounded-md">
                          {a.assetType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {fmt(a.valuation, user?.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {fmt(a.investedAmount, user?.currency)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold ${
                        returnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {fmtPct(returnPct)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            aria-label="Edit asset"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDelete(a._id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            aria-label="Delete asset"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. Add/Edit Asset Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAsset ? 'Edit Investment' : 'Add Investment / Asset'}
      >
        <div className="space-y-4">
          <Input
            label="NAME / LABEL"
            placeholder="e.g. Vanguard S&P 500 ETF"
            value={form.name}
            onChange={set('name')}
            className="rounded-xl border-slate-200 focus:border-indigo-500"
          />

          <Select
            label="TYPE"
            value={form.assetType}
            onChange={set('assetType')}
            className="rounded-xl border-slate-200 focus:border-indigo-500"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="VALUE ($)"
              type="number"
              min="0"
              placeholder="1000"
              value={form.valuation}
              onChange={set('valuation')}
              className="rounded-xl border-slate-200 focus:border-indigo-500"
            />
            <Input
              label="INVESTED ($)"
              type="number"
              min="0"
              placeholder="1000"
              value={form.investedAmount}
              onChange={set('investedAmount')}
              className="rounded-xl border-slate-200 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="TICKER (OPTIONAL)"
              placeholder="VOO"
              value={form.ticker}
              onChange={set('ticker')}
              className="rounded-xl border-slate-200 focus:border-indigo-500"
            />
            <Input
              label="QUANTITY (OPTIONAL)"
              type="number"
              min="0"
              placeholder="10"
              value={form.quantity}
              onChange={set('quantity')}
              className="rounded-xl border-slate-200 focus:border-indigo-500"
            />
          </div>

          <Input
            label="NOTES (OPTIONAL)"
            placeholder="Account or broker details"
            value={form.notes}
            onChange={set('notes')}
            className="rounded-xl border-slate-200 focus:border-indigo-500"
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-semibold text-sm shadow-xs transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Saving…</span>
                </>
              ) : (
                'Save Investment'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 7. Delete Asset Modal ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAssetToDelete(null);
        }}
        title="Delete this asset?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this asset from your portfolio? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setAssetToDelete(null);
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs cursor-pointer"
            >
              Delete asset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
