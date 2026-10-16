import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Flame,
  Plus, ArrowLeftRight, Wallet, CheckCircle, Circle, Activity,
  Calendar, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { transactionsAPI } from '../api/transactions';
import { habitsAPI } from '../api/habits';
import { wealthAPI } from '../api/wealth';
import { goalsAPI } from '../api/goals';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card, { StatCard } from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { StatCardSkeleton, ChartSkeleton, CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6'];

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const CATEGORY_ICONS = {
  'Emergency Fund': '🛡️', 'Travel': '✈️', 'Home': '🏠', 'Education': '🎓',
  'Vehicle': '🚗', 'Retirement': '🏖️', 'Electronics': '💻', 'Wedding': '💍', 'Other': '🎯',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-3 text-xs shadow-elevated animate-fade-in min-w-[140px]">
      <p className="font-semibold text-slate-900 mb-1.5 pb-1 border-b border-slate-100">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey || p.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }} />
              {p.name}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [habits, setHabits] = useState([]);
  const [netWorth, setNetWorth] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [goals, setGoals] = useState([]);
  
  const [checkingIn, setCheckingIn] = useState(null);
  
  const [contribModal, setContribModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchData = async () => {
    try {
      const [sumRes, habRes, nwRes, txRes, goalRes] = await Promise.all([
        transactionsAPI.getSummary({ months: 6 }),
        habitsAPI.getAll({ isActive: true }),
        wealthAPI.getNetWorth(),
        transactionsAPI.getAll({ limit: 8, sort: '-date' }),
        goalsAPI.getAll()
      ]);
      setSummary(sumRes.data.data.summary);
      setHabits(habRes.data.data.habits);
      setNetWorth(nwRes.data.data);
      setRecentTx(txRes.data.data);
      setGoals(goalRes.data.data.goals.filter(g => !g.isCompleted));
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (habit) => {
    const today = new Date().toDateString();
    const checkedToday = habit.logs?.some((l) => new Date(l.date).toDateString() === today && l.completed);
    setCheckingIn(habit._id);
    try {
      await habitsAPI.checkIn(habit._id);
      toast.success(checkedToday ? 'Check-in removed.' : `"${habit.title}" checked in!`);
      const habRes = await habitsAPI.getAll({ isActive: true });
      setHabits(habRes.data.data.habits);
    } catch {
      toast.error('Check-in failed.');
    } finally {
      setCheckingIn(null);
    }
  };

  const openContrib = (goal) => { 
    setSelectedGoal(goal); 
    setContribAmount(''); 
    setContribNote(''); 
    setContribModal(true); 
  };

  const handleContribute = async () => {
    if (!contribAmount || Number(contribAmount) <= 0) return toast.error('Enter a valid amount.');
    setSavingGoal(true);
    try {
      await goalsAPI.contribute(selectedGoal._id, { amount: Number(contribAmount), note: contribNote });
      toast.success(`$${contribAmount} added to "${selectedGoal.title}"!`);
      setContribModal(false);
      const res = await goalsAPI.getAll();
      setGoals(res.data.data.goals.filter(g => !g.isCompleted));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Contribution failed.');
    } finally {
      setSavingGoal(false);
    }
  };

  // Calculations & zero-data safeguards
  const currentMonth = summary[summary.length - 1] || { income: 0, expense: 0 };
  const prevMonth = summary[summary.length - 2] || { income: 0, expense: 0 };
  const savingsRate = currentMonth.income > 0
    ? (((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100).toFixed(1)
    : '0.0';
  const incomeTrend = prevMonth.income > 0
    ? ((currentMonth.income - prevMonth.income) / prevMonth.income) * 100 : 0;
  const expenseTrend = prevMonth.expense > 0
    ? ((currentMonth.expense - prevMonth.expense) / prevMonth.expense) * 100 : 0;

  const hasBarData = summary && summary.length > 0 && summary.some((s) => (s.income > 0 || s.expense > 0));

  const expByCategory = recentTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const pieData = Object.entries(expByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const activeHabitsWithStreak = habits.filter((h) => h.currentStreak > 0);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-slate-200/70 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <ChartSkeleton height="h-[360px]" />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <ChartSkeleton height="h-[360px]" />
          </div>
          <CardSkeleton height="h-64" />
          <CardSkeleton height="h-64" />
          <CardSkeleton height="h-64" />
          <div className="md:col-span-2 lg:col-span-3">
            <TableSkeleton rows={5} cols={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page Header */}
      <PageHeader 
        title={`Welcome, ${user?.name?.split(' ')[0]} 👋`}
        description="Institutional portfolio metrics, streak momentum, and capital growth."
      >
        <Link to="/transactions">
          <Button size="sm">
            <Plus size={15} /> Add Transaction
          </Button>
        </Link>
      </PageHeader>

      {/* KPI Stat Cards with tabular numbers and refined borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Net Worth"
          value={<span className="tabular-nums">{fmt(netWorth?.totalValuation || 0, user?.currency)}</span>}
          sub={<span className="tabular-nums">Cost Basis: {fmt(netWorth?.totalInvested || 0, user?.currency)}</span>}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Income"
          value={<span className="tabular-nums">{fmt(currentMonth.income, user?.currency)}</span>}
          trend={incomeTrend}
          color="emerald"
        />
        <StatCard
          icon={TrendingDown}
          label="Monthly Expenses"
          value={<span className="tabular-nums">{fmt(currentMonth.expense, user?.currency)}</span>}
          trend={expenseTrend}
          color="red"
        />
        <StatCard
          icon={DollarSign}
          label="Savings Rate"
          value={<span className="tabular-nums">{savingsRate}%</span>}
          sub="of gross cash preserved"
          color={savingsRate >= 20 ? 'emerald' : savingsRate >= 10 ? 'amber' : 'red'}
        />
        <StatCard
          icon={Activity}
          label="Active Streaks"
          value={<span className="tabular-nums">{activeHabitsWithStreak.length}</span>}
          sub="disciplines maintained"
          color="amber"
        />
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expenses Bar Chart */}
        <Card className="md:col-span-2 lg:col-span-2 flex flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900 tracking-tight text-base">Income vs Expenses</h2>
              <p className="text-xs text-slate-400 mt-0.5">Bi-annual cash flow distribution</p>
            </div>
            <Badge color="emerald" size="sm">6 Months</Badge>
          </div>
          <div className="flex-1 min-h-[300px] flex flex-col justify-center">
            {hasBarData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: '16px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
                  <ArrowLeftRight size={22} />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No Cash Flow Data Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                  Record your initial earnings or routine expenditures to visualize bi-annual cash flow momentum.
                </p>
                <Link to="/transactions">
                  <Button size="sm">
                    <Plus size={14} /> Record First Transaction
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Expense Distribution Donut Chart */}
        <Card className="md:col-span-2 lg:col-span-1 flex flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900 tracking-tight text-base">Spending Allocation</h2>
              <p className="text-xs text-slate-400 mt-0.5">Top expenditure categories</p>
            </div>
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Recent</span>
          </div>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
                  <DollarSign size={22} />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No Expense Outflows</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4 leading-relaxed">
                  Categorized spending distributions will aggregate here as expenses are logged.
                </p>
                <Link to="/transactions">
                  <Button size="sm" variant="secondary">
                    <Plus size={14} /> Log Expense
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Wealth Assets Summary */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm tracking-tight">
              <Wallet size={17} className="text-emerald-600" /> Wealth Allocation
            </h2>
            <Link to="/wealth" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {netWorth?.assets?.length === 0 ? (
            <div className="text-center py-8 text-slate-400 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                <Wallet size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-700">No assets recorded</p>
              <p className="text-2xs text-slate-400 mt-0.5 mb-3">Track equities, crypto, and real estate.</p>
              <Link to="/wealth"><Button variant="secondary" size="sm"><Plus size={13} /> Add First Asset</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {netWorth?.assets?.slice(0, 4).map((a) => {
                const returnPct = a.investedAmount > 0 ? (((a.valuation - a.investedAmount) / a.investedAmount) * 100) : 0;
                return (
                  <div
                    key={a._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/60 transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{a.name}</p>
                      <p className="text-2xs text-slate-400 capitalize">{a.assetType}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 tabular-nums">{fmt(a.valuation, user?.currency)}</p>
                      <p className={`text-2xs font-semibold tabular-nums ${returnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Savings Goals */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm tracking-tight">
              <Target size={17} className="text-indigo-600" /> Savings Goals
            </h2>
            <Link to="/goals" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 mb-2.5">
                <Target size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-700">No active goals</p>
              <p className="text-2xs text-slate-400 mt-0.5 mb-3">Define milestones for emergency or travel.</p>
              <Link to="/goals"><Button variant="secondary" size="sm"><Plus size={13} /> Create First Goal</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map((g) => {
                const pct = g.targetAmount > 0
                  ? Math.min((g.currentAmount / g.targetAmount) * 100, 100).toFixed(1)
                  : '0.0';
                return (
                  <div
                    key={g._id}
                    className="p-3 rounded-xl border border-slate-100 hover:border-slate-200/80 transition-all bg-white"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{g.icon || CATEGORY_ICONS[g.category] || '🎯'}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{g.title}</p>
                          <p className="text-2xs text-slate-400 tabular-nums mt-0.5">
                            {fmt(g.currentAmount)} / {fmt(g.targetAmount)} ({pct}%)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => openContrib(g)}
                        className="text-2xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-1 rounded-lg transition-colors shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Habit Check-In */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm tracking-tight">
              <Flame size={17} className="text-amber-500" /> Habit Check-In
            </h2>
            <Link to="/habits" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {habits.length === 0 ? (
            <div className="text-center py-8 text-slate-400 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-500 mb-2.5">
                <Flame size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-700">No active habits</p>
              <p className="text-2xs text-slate-400 mt-0.5 mb-3">Build streaks for savings or budget reviews.</p>
              <Link to="/habits"><Button variant="secondary" size="sm"><Plus size={13} /> Create First Habit</Button></Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {habits.slice(0, 4).map((h) => {
                const today = new Date().toDateString();
                const checkedToday = h.logs?.some((l) => new Date(l.date).toDateString() === today && l.completed);
                return (
                  <div
                    key={h._id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200/80 transition-all bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                          checkedToday ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        {h.icon}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate transition-colors ${
                            checkedToday ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        >
                          {h.title}
                        </p>
                        <p className="text-2xs font-semibold text-amber-600 flex items-center gap-1 mt-0.5 tabular-nums">
                          <Flame size={11} className="text-amber-500" /> {h.currentStreak || 0} day streak
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckIn(h)}
                      disabled={checkingIn === h._id}
                      className={`flex items-center justify-center p-2 rounded-xl transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                        checkedToday 
                          ? 'bg-emerald-100/90 text-emerald-700 shadow-xs' 
                          : 'bg-white border border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/60'
                      }`}
                      title={checkedToday ? 'Undo check-in' : 'Check in today'}
                      aria-label={checkedToday ? 'Undo check-in' : 'Check in today'}
                    >
                      {checkingIn === h._id ? (
                        <Spinner size="sm" />
                      ) : checkedToday ? (
                        <CheckCircle size={18} className="fill-current text-emerald-600" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Transactions Table */}
        <Card className="md:col-span-2 lg:col-span-3 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-base tracking-tight">
                <ArrowLeftRight size={17} className="text-slate-600" /> Recent Transactions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time ledger activity</p>
            </div>
            <Link to="/transactions" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                <ArrowLeftRight size={20} />
              </div>
              <p className="font-semibold text-slate-700 text-xs">No recent transaction records</p>
              <p className="text-2xs text-slate-400 mt-0.5 mb-3">Log your daily revenues or expenses to view live ledger flow.</p>
              <Link to="/transactions">
                <Button size="sm"><Plus size={13} /> Record First Transaction</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="w-full min-w-[540px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th scope="col" className="text-left py-2.5 px-5 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</th>
                    <th scope="col" className="text-left py-2.5 px-5 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="text-left py-2.5 px-5 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="text-right py-2.5 px-5 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTx.slice(0, 5).map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                              tx.type === 'income'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-rose-50 border-rose-100 text-rose-600'
                            }`}
                          >
                            {tx.type === 'income' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          </div>
                          <span className="text-xs font-semibold text-slate-900 truncate max-w-[220px]">
                            {tx.description || tx.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <Badge color={tx.type === 'income' ? 'emerald' : 'slate'} size="sm">
                          {tx.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-xs text-slate-500 tabular-nums">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className={`py-3 px-5 text-xs font-bold text-right tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount, user?.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>

      {/* Contribute Modal for Goals */}
      <Modal isOpen={contribModal} onClose={() => setContribModal(false)} title={`Add to "${selectedGoal?.title}"`} size="sm">
        <div className="space-y-4">
          {selectedGoal && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between text-slate-600 mb-1.5">
                <span>Current Saved</span>
                <span className="font-semibold text-slate-900 tabular-nums">{fmt(selectedGoal.currentAmount, user?.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Remaining Target</span>
                <span className="text-emerald-700 font-bold tabular-nums">
                  {fmt(selectedGoal.targetAmount - selectedGoal.currentAmount, user?.currency)}
                </span>
              </div>
            </div>
          )}
          <Input
            label="Contribution amount ($)"
            type="number"
            min="0.01"
            placeholder="100.00"
            value={contribAmount}
            onChange={(e) => setContribAmount(e.target.value)}
            disabled={savingGoal}
          />
          <Input
            label="Note (optional)"
            placeholder="e.g. Dividend payout allocation"
            value={contribNote}
            onChange={(e) => setContribNote(e.target.value)}
            disabled={savingGoal}
          />
          <div className="flex gap-2.5 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setContribModal(false)} disabled={savingGoal}>
              Cancel
            </Button>
            <Button className="flex-1" loading={savingGoal} disabled={savingGoal} onClick={handleContribute}>
              {savingGoal ? 'Adding Funds...' : 'Add Funds'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
