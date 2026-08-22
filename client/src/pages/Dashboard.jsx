import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Flame,
  Plus, ArrowLeftRight, Wallet, CheckCircle, Circle, TrendingUp as TrendingUpIcon, Activity,
  Clock
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
import { StatCard } from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const CATEGORY_ICONS = {
  'Emergency Fund': '🛡️', 'Travel': '✈️', 'Home': '🏠', 'Education': '🎓',
  'Vehicle': '🚗', 'Retirement': '🏖️', 'Electronics': '💻', 'Wedding': '💍', 'Other': '🎯',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-xl">
      <p className="font-semibold text-slate-900 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
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
      toast.success(checkedToday ? 'Check-in removed.' : `✅ "${habit.title}" checked in!`);
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
    } catch (err) { toast.error(err.response?.data?.message || 'Contribution failed.'); }
    finally { setSavingGoal(false); }
  };

  // Calculations
  const currentMonth = summary[summary.length - 1] || { income: 0, expense: 0 };
  const prevMonth = summary[summary.length - 2] || { income: 0, expense: 0 };
  const savingsRate = currentMonth.income > 0
    ? (((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100).toFixed(1)
    : 0;
  const incomeTrend = prevMonth.income > 0
    ? ((currentMonth.income - prevMonth.income) / prevMonth.income) * 100 : 0;
  const expenseTrend = prevMonth.expense > 0
    ? ((currentMonth.expense - prevMonth.expense) / prevMonth.expense) * 100 : 0;

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
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <PageHeader 
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0]} 👋`}
        description="Here's your financial command center."
      >
        <Link to="/transactions">
          <Button size="sm">
            <Plus size={16} /> Add Transaction
          </Button>
        </Link>
      </PageHeader>

      {/* KPI Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Net Worth"
          value={fmt(netWorth?.totalValuation || 0, user?.currency)}
          sub={`Invested: ${fmt(netWorth?.totalInvested || 0, user?.currency)}`}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Income"
          value={fmt(currentMonth.income, user?.currency)}
          trend={incomeTrend}
          color="emerald"
        />
        <StatCard
          icon={TrendingDown}
          label="Monthly Expenses"
          value={fmt(currentMonth.expense, user?.currency)}
          trend={expenseTrend}
          color="red"
        />
        <StatCard
          icon={DollarSign}
          label="Savings Rate"
          value={`${savingsRate}%`}
          sub="of income saved this month"
          color={savingsRate >= 20 ? 'emerald' : savingsRate >= 10 ? 'amber' : 'red'}
        />
        <StatCard
          icon={Activity}
          label="Active Streaks"
          value={activeHabitsWithStreak.length}
          sub="habits currently on fire"
          color="orange"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Primary Large Card: Income vs Expense Bar Chart */}
        <div className="card md:col-span-2 lg:col-span-2 flex flex-col">
          <h2 className="font-semibold text-slate-900 mb-6">Income vs Expenses</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Legend wrapperStyle={{ fontSize: 13, color: '#64748b', paddingTop: '20px' }} iconType="circle" iconSize={8} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Card: Expense Distribution Donut Chart */}
        <div className="card md:col-span-2 lg:col-span-1 flex flex-col">
          <h2 className="font-semibold text-slate-900 mb-6">Spending Breakdown</h2>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm text-center">No expense data yet</div>
            )}
          </div>
        </div>

        {/* Wealth Summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Wallet size={18} className="text-blue-600" /> Wealth Assets
            </h2>
            <Link to="/wealth" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          {netWorth?.assets?.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm mb-2">No assets tracked.</p>
              <Link to="/wealth"><Button variant="secondary" size="sm">Add Asset</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {netWorth?.assets?.slice(0, 4).map(a => {
                 const returnPct = a.investedAmount > 0 ? (((a.valuation - a.investedAmount) / a.investedAmount) * 100) : 0;
                 return (
                  <div key={a._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.assetType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{fmt(a.valuation, user?.currency)}</p>
                      <p className={`text-xs font-semibold ${returnPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </div>

        {/* Savings Goals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Target size={18} className="text-indigo-600" /> Savings Goals
            </h2>
            <Link to="/goals" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm mb-2">No active goals.</p>
              <Link to="/goals"><Button variant="secondary" size="sm">Create Goal</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 3).map(g => {
                const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100).toFixed(1);
                return (
                  <div key={g._id} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-soft transition-all bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{g.icon || CATEGORY_ICONS[g.category] || '🎯'}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight">{g.title}</p>
                          <p className="text-xs text-slate-500">{fmt(g.currentAmount)} / {fmt(g.targetAmount)}</p>
                        </div>
                      </div>
                      <button onClick={() => openContrib(g)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors">
                        Add
                      </button>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Habit Check-In */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Flame size={18} className="text-orange-500" /> Habit Check-In
            </h2>
            <Link to="/habits" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          {habits.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm mb-2">No active habits.</p>
              <Link to="/habits"><Button variant="secondary" size="sm">Create Habit</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.slice(0, 4).map((h) => {
                const today = new Date().toDateString();
                const checkedToday = h.logs?.some((l) => new Date(l.date).toDateString() === today && l.completed);
                return (
                  <div key={h._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all bg-white group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${checkedToday ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                        {h.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${checkedToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{h.title}</p>
                        <p className="text-xs font-semibold text-orange-500 flex items-center gap-1 mt-0.5">
                          <Flame size={12} /> {h.currentStreak} day streak
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckIn(h)}
                      disabled={checkingIn === h._id}
                      className={`flex items-center justify-center p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        checkedToday 
                          ? 'bg-emerald-100 text-emerald-600 shadow-sm' 
                          : 'bg-white border border-slate-200 text-slate-300 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50'
                      }`}
                      title={checkedToday ? 'Undo check-in' : 'Check in today'}
                      aria-label={checkedToday ? 'Undo check-in' : 'Check in today'}
                    >
                      {checkingIn === h._id ? <Spinner size="sm" /> : checkedToday ? <CheckCircle size={20} className="fill-current text-emerald-600" /> : <Circle size={20} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-slate-600" /> Recent Transactions
            </h2>
            <Link to="/transactions" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTx.slice(0, 5).map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {tx.type === 'income' ? <TrendingUpIcon size={14} /> : <TrendingDown size={14} />}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{tx.description || tx.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Badge color="slate">{tx.category}</Badge></td>
                      <td className="py-3 px-4 text-sm text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className={`py-3 px-4 text-sm font-bold text-right ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, user?.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Contribute Modal for Goals */}
      <Modal isOpen={contribModal} onClose={() => setContribModal(false)} title={`Add to "${selectedGoal?.title}"`} size="sm">
        <div className="space-y-4">
          {selectedGoal && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Current Saved</span>
                <span className="font-semibold text-slate-900">{fmt(selectedGoal.currentAmount, user?.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Remaining</span>
                <span className="text-emerald-600 font-bold">{fmt(selectedGoal.targetAmount - selectedGoal.currentAmount, user?.currency)}</span>
              </div>
            </div>
          )}
          <Input label="Contribution amount ($)" type="number" min="0.01" placeholder="100" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} />
          <Input label="Note (optional)" placeholder="Monthly savings" value={contribNote} onChange={(e) => setContribNote(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setContribModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={savingGoal} onClick={handleContribute}>Add Funds</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
