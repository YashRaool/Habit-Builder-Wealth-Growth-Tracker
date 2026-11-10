import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Flame,
  Plus, CheckCircle, Circle, ArrowLeftRight, Wallet
} from 'lucide-react';
import { transactionsAPI } from '../api/transactions';
import { habitsAPI } from '../api/habits';
import { wealthAPI } from '../api/wealth';
import { goalsAPI } from '../api/goals';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const ASSET_TYPES = ['Stocks', 'Crypto', 'Real Estate', 'Cash & Savings', 'Bonds', 'Mutual Funds', 'ETF', 'Commodity', 'Other'];
const CATEGORIES = {
  expense: ['Food & Dining', 'Housing', 'Transportation', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Utilities', 'Insurance', 'Travel', 'Personal Care', 'Other Expense'],
  income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Gift', 'Other Income'],
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [habits, setHabits] = useState([]);
  const [netWorth, setNetWorth] = useState(null);
  const [goals, setGoals] = useState([]);
  
  const [checkingIn, setCheckingIn] = useState(null);
  
  // Modals
  const [contribModal, setContribModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState('expense');
  const [txForm, setTxForm] = useState({ category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
  const [savingTx, setSavingTx] = useState(false);

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: '', assetType: 'ETF', valuation: '', investedAmount: '' });
  const [savingAsset, setSavingAsset] = useState(false);

  const fetchData = async () => {
    try {
      const [sumRes, habRes, nwRes, goalRes] = await Promise.all([
        transactionsAPI.getSummary({ months: 6 }),
        habitsAPI.getAll({ isActive: true }),
        wealthAPI.getNetWorth(),
        goalsAPI.getAll()
      ]);
      setSummary(sumRes.data.data.summary || []);
      setHabits(habRes.data.data.habits || []);
      setNetWorth(nwRes.data.data || null);
      setGoals(goalRes.data.data.goals?.filter((g) => !g.isCompleted) || []);
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
      setHabits(habRes.data.data.habits || []);
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
      setGoals(res.data.data.goals?.filter((g) => !g.isCompleted) || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Contribution failed.');
    } finally {
      setSavingGoal(false);
    }
  };

  // Quick Action Handlers
  const openAddExpense = () => {
    setTxType('expense');
    setTxForm({ category: CATEGORIES.expense[0], amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
    setTxModalOpen(true);
  };

  const openAddIncome = () => {
    setTxType('income');
    setTxForm({ category: CATEGORIES.income[0], amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
    setTxModalOpen(true);
  };

  const handleSaveTx = async () => {
    if (!txForm.amount || Number(txForm.amount) <= 0) return toast.error('Enter a valid amount.');
    setSavingTx(true);
    try {
      await transactionsAPI.create({ ...txForm, type: txType });
      toast.success(`${txType === 'expense' ? 'Expense' : 'Income'} recorded.`);
      setTxModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed.');
    } finally {
      setSavingTx(false);
    }
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name || !assetForm.valuation) return toast.error('Asset name and valuation are required.');
    setSavingAsset(true);
    try {
      await wealthAPI.createAsset({
        ...assetForm,
        investedAmount: assetForm.investedAmount || assetForm.valuation,
      });
      toast.success('Investment asset added.');
      setAssetModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Asset creation failed.');
    } finally {
      setSavingAsset(false);
    }
  };

  const scrollToHabits = () => {
    const el = document.getElementById('habits-card');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculations
  const currentMonth = summary[summary.length - 1] || { income: 0, expense: 0 };
  const prevMonth = summary[summary.length - 2] || { income: 0, expense: 0 };
  const netCashflow = currentMonth.income - currentMonth.expense;
  const savingsRate = currentMonth.income > 0
    ? (((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100).toFixed(1)
    : '0.0';
  const totalReturn = Number(netWorth?.totalReturn) || 0;
  const safeTotalReturn = isNaN(totalReturn) ? 0 : totalReturn;
  const spentRatio = currentMonth.income > 0 ? (currentMonth.expense / currentMonth.income) * 100 : 0;
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  // ── 1. Shimmer Skeleton Loading State ──
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-60 bg-slate-200/80 rounded-xl" />
            <div className="h-4 w-44 bg-slate-200/60 rounded-md" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-10 w-32 bg-slate-200/80 rounded-xl" />
            <div className="h-10 w-28 bg-slate-200/60 rounded-xl" />
            <div className="h-10 w-28 bg-slate-200/60 rounded-xl" />
          </div>
        </div>

        {/* 3 Top KPI Cards Skeleton */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-48 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-slate-200/70 rounded-md" />
                <div className="h-4 w-16 bg-slate-200/60 rounded-md" />
              </div>
              <div className="h-9 w-40 bg-slate-200/80 rounded-lg" />
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200/60 rounded-full" />
                <div className="h-4 w-24 bg-slate-200/60 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* 2 Bottom Bento Skeleton Cards */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-96 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="h-5 w-36 bg-slate-200/80 rounded-md" />
              <div className="h-4 w-16 bg-slate-200/60 rounded-md" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-12 bg-slate-100/80 rounded-xl" />
              ))}
            </div>
            <div className="h-4 w-28 bg-slate-200/50 rounded-md" />
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-96 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="h-5 w-44 bg-slate-200/80 rounded-md" />
              <div className="h-4 w-16 bg-slate-200/60 rounded-md" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, k) => (
                <div key={k} className="h-20 bg-slate-100/80 rounded-xl" />
              ))}
            </div>
            <div className="h-4 w-20 bg-slate-200/50 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* ── 2. Header & Disciplined Quick Actions Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Investor'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{todayFormatted} · Financial Overview</p>
        </div>

        {/* Unified SaaS button group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary CTA */}
          <button
            onClick={openAddExpense}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Expense
          </button>

          {/* Secondary Outlined CTAs */}
          <button
            onClick={openAddIncome}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            Add Income
          </button>

          <button
            onClick={() => { setAssetForm({ name: '', assetType: 'ETF', valuation: '', investedAmount: '' }); setAssetModalOpen(true); }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
            Add Investment
          </button>

          <button
            onClick={scrollToHabits}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle size={15} className="text-emerald-600" />
            Habit Check-in
          </button>
        </div>
      </div>

      {/* ── 3. Top 3 Equal-Height KPI Cards ── */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        
        {/* Card 1: TOTAL NET WORTH */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Net Worth</span>
            <Link to="/wealth" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Analytics →
            </Link>
          </div>
          <div className="my-3">
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {fmt(netWorth?.totalValuation || 0, user?.currency)}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className={`px-2.5 py-0.5 rounded-full font-medium ${safeTotalReturn >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {safeTotalReturn >= 0 ? '+' : ''}{safeTotalReturn.toFixed(1)}% all-time
            </span>
            <span className="text-slate-500 font-medium">
              Invested: {fmt(netWorth?.totalInvested || 0, user?.currency)}
            </span>
          </div>
        </div>

        {/* Card 2: CASHFLOW THIS MONTH */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cashflow This Month</span>
            <Link to="/transactions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Tracker →
            </Link>
          </div>
          <div className="my-2">
            <p className={`text-3xl font-bold tracking-tight ${netCashflow >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {netCashflow >= 0 ? '+' : ''}{fmt(netCashflow, user?.currency)}
            </p>
            {/* Income vs Spent breakdown bar */}
            <div className="mt-2.5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>In: {fmt(currentMonth.income, user?.currency)}</span>
                <span>Out: {fmt(currentMonth.expense, user?.currency)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(spentRatio, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium">
              {savingsRate}% saved
            </span>
            <span className="text-slate-500 font-medium">
              Saved: {fmt(Math.max(currentMonth.income - currentMonth.expense, 0), user?.currency)}
            </span>
          </div>
        </div>

        {/* Card 3: ACTIVE INVESTMENTS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Investments</span>
            <Link to="/wealth" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View →
            </Link>
          </div>
          <div className="my-3">
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {netWorth?.assets?.length || 0} Assets
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Portfolio valuation: {fmt(netWorth?.totalValuation || 0, user?.currency)}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
              {Object.keys(netWorth?.byType || {}).length} asset classes
            </span>
            <span className="text-slate-500 font-medium">
              Cost basis: {fmt(netWorth?.totalInvested || 0, user?.currency)}
            </span>
          </div>
        </div>

      </div>

      {/* ── 4. Bottom 2-Column Bento Grid ── */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Left (lg:col-span-7): Active Habit Streaks */}
        <div id="habits-card" className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Flame size={18} className="text-amber-500 fill-amber-500" /> Active Habit Streaks
              </h2>
              <Link to="/habits" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View all →
              </Link>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
                  <Flame size={22} className="stroke-[2.2]" />
                </div>
                <p className="text-sm font-bold text-slate-800">No active habits yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Build daily financial discipline to compound your net worth.</p>
                <Link to="/habits" className="mt-3.5 inline-block">
                  <Button size="sm" className="rounded-xl flex items-center gap-1.5 shadow-xs">
                    <Plus size={14} /> Add Habit
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {habits.slice(0, 5).map((h) => {
                  const today = new Date().toDateString();
                  const checkedToday = h.logs?.some((l) => new Date(l.date).toDateString() === today && l.completed);
                  return (
                    <div
                      key={h._id}
                      className="bg-slate-50/70 hover:bg-slate-100/60 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Compact streak badge */}
                        <div className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0">
                          <Flame size={13} className="text-amber-500 fill-amber-500" />
                          <span>{h.currentStreak || 0}d</span>
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm truncate ${checkedToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {h.title}
                          </p>
                          <p className="text-xs text-slate-500 capitalize mt-0.5">
                            {h.frequency} {h.targetAmount ? `· ${fmt(h.targetAmount, user?.currency)}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Crisp Done emerald pill button */}
                      <button
                        onClick={() => handleCheckIn(h)}
                        disabled={checkingIn === h._id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          checkedToday
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        {checkingIn === h._id ? (
                          <Spinner size="sm" />
                        ) : checkedToday ? (
                          <>
                            <CheckCircle size={14} className="text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Circle size={14} className="text-slate-400" />
                            <span>Check In</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Consistency builds financial independence</span>
            <Link to="/habits" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Manage Habits
            </Link>
          </div>
        </div>

        {/* Right (lg:col-span-5): Savings Goals Progress */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Target size={18} className="text-indigo-600" /> Savings Goals Progress
              </h2>
              <Link to="/goals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View all →
              </Link>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
                  <Target size={22} className="stroke-[2.2]" />
                </div>
                <p className="text-sm font-bold text-slate-800">No savings targets yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Define a target to track automated milestone progress.</p>
                <Link to="/goals" className="mt-3.5 inline-block">
                  <Button size="sm" className="rounded-xl flex items-center gap-1.5 shadow-xs">
                    <Plus size={14} /> Add Goal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 3).map((g) => {
                  const rawPct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                  const pct = Math.min(isNaN(rawPct) ? 0 : rawPct, 100);
                  const isComplete = pct >= 100;
                  return (
                    <div key={g._id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{g.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {fmt(g.currentAmount, user?.currency)} of {fmt(g.targetAmount, user?.currency)}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isComplete ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>

                      {/* Smooth Progress Bar */}
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          {fmt(Math.max(g.targetAmount - g.currentAmount, 0), user?.currency)} remaining
                        </span>
                        <button
                          onClick={() => openContrib(g)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                        >
                          + Add Deposit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{goals.length} target{goals.length === 1 ? '' : 's'} in progress</span>
            <Link to="/goals" className="font-semibold text-indigo-600 hover:text-indigo-700">
              View All Goals
            </Link>
          </div>
        </div>

      </div>

      {/* ── Contribute Modal for Goals ── */}
      <Modal isOpen={contribModal} onClose={() => setContribModal(false)} title={`Add Deposit to "${selectedGoal?.title}"`} size="sm">
        <div className="space-y-4">
          {selectedGoal && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm">
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Current Saved</span>
                <span className="font-semibold text-slate-900">{fmt(selectedGoal.currentAmount, user?.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Remaining Target</span>
                <span className="text-indigo-600 font-semibold">{fmt(selectedGoal.targetAmount - selectedGoal.currentAmount, user?.currency)}</span>
              </div>
            </div>
          )}
          <Input label="Deposit amount ($)" type="number" min="0.01" placeholder="100" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} />
          <Input label="Note (optional)" placeholder="e.g. Weekly savings deposit" value={contribNote} onChange={(e) => setContribNote(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setContribModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={savingGoal} onClick={handleContribute}>Add Deposit</Button>
          </div>
        </div>
      </Modal>

      {/* ── Quick Add Transaction Modal (Expense / Income) ── */}
      <Modal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} title={txType === 'expense' ? 'Add Expense' : 'Add Income'} size="sm">
        <div className="space-y-4">
          <Input
            label="Amount ($)"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={txForm.amount}
            onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
          />
          <Select
            label="Category"
            value={txForm.category}
            onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
          >
            {(CATEGORIES[txType] || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input
            label="Date"
            type="date"
            value={txForm.date}
            onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
          />
          <Input
            label="Description (optional)"
            placeholder="e.g. Grocery trip, Client invoice..."
            value={txForm.description}
            onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setTxModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={savingTx} onClick={handleSaveTx}>
              Save {txType === 'expense' ? 'Expense' : 'Income'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Quick Add Investment Modal ── */}
      <Modal isOpen={assetModalOpen} onClose={() => setAssetModalOpen(false)} title="Add Investment Asset" size="sm">
        <div className="space-y-4">
          <Input
            label="Asset name"
            placeholder="e.g. Vanguard S&P 500 ETF"
            value={assetForm.name}
            onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
          />
          <Select
            label="Asset type"
            value={assetForm.assetType}
            onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valuation ($)"
              type="number"
              min="0"
              placeholder="1000"
              value={assetForm.valuation}
              onChange={(e) => setAssetForm({ ...assetForm, valuation: e.target.value })}
            />
            <Input
              label="Invested ($)"
              type="number"
              min="0"
              placeholder="1000"
              value={assetForm.investedAmount}
              onChange={(e) => setAssetForm({ ...assetForm, investedAmount: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAssetModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={savingAsset} onClick={handleSaveAsset}>Add Investment</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
