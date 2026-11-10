import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Target, Trash2, Pencil, CheckCircle, Clock, TrendingUp,
  Trophy, PiggyBank, Sparkles, Loader2,
} from 'lucide-react';
import { goalsAPI } from '../api/goals';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';

/* ─── Constants ───────────────────────────────────────────────── */
const GOAL_CATEGORIES = [
  'Emergency Fund', 'Travel', 'Home', 'Education',
  'Vehicle', 'Retirement', 'Electronics', 'Wedding', 'Other',
];
const CATEGORY_ICONS = {
  'Emergency Fund': '🛡️', 'Travel': '✈️', 'Home': '🏠', 'Education': '🎓',
  'Vehicle': '🚗', 'Retirement': '🏖️', 'Electronics': '💻', 'Wedding': '💍', 'Other': '🎯',
};

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const EMPTY_FORM = {
  title: '', targetAmount: '', deadline: '', category: 'Other', color: '#4f46e5', icon: '🎯',
};

/* ─── Deadline Helper ─────────────────────────────────────────── */
function deadlineInfo(deadline) {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due - now) / 86400000);
  if (days > 0) return { label: `${days}d left`, isOverdue: false };
  if (days === 0) return { label: 'Due today', isOverdue: true };
  return { label: `${Math.abs(days)}d overdue`, isOverdue: true };
}

/* ─── Goal Card ───────────────────────────────────────────────── */
function GoalCard({ goal, onEdit, onDelete, onContribute, currency }) {
  const isReached = goal.isCompleted || (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount);
  const pct = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const dl = deadlineInfo(goal.deadline);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-4 transition-all duration-150 hover:border-slate-300">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular Percentage Ring */}
          <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                className="text-slate-100 stroke-current"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                className={`stroke-current transition-all duration-700 ${
                  isReached ? 'text-emerald-500' : 'text-indigo-600'
                }`}
                strokeWidth="4"
                strokeDasharray={113.1}
                strokeDashoffset={113.1 - (pct / 100) * 113.1}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-slate-800">
              {Math.round(pct)}%
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate leading-snug">{goal.title}</h3>
            <span className="inline-block bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 text-xs font-medium capitalize mt-0.5">
              {goal.category || 'Other'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
            title="Edit goal"
            aria-label="Edit goal"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
            title="Delete goal"
            aria-label="Delete goal"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isReached ? 'bg-emerald-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 4-Column Stat Grid */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SAVED</span>
          <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {fmt(goal.currentAmount, currency)}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TARGET</span>
          <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {fmt(goal.targetAmount, currency)}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">REMAINING</span>
          <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {fmt(remaining, currency)}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DEADLINE</span>
          <p className="text-sm truncate mt-0.5">
            {dl ? (
              <span className={dl.isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-700 font-semibold'}>
                {dl.label}
              </span>
            ) : (
              <span className="text-slate-400 font-medium">None</span>
            )}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-1 flex items-center justify-between">
        {isReached ? (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-600" />
            <span>✓ Goal reached!</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onContribute(goal)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Add contribution</span>
          </button>
        )}
        <span className="text-xs text-slate-400 font-medium">
          {goal.contributions?.length || 0} {(goal.contributions?.length || 0) === 1 ? 'deposit' : 'deposits'}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function Goals() {
  const { user } = useAuth();
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [contribModal, setContribModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Fetch ── */
  const fetchGoals = useCallback(async () => {
    try {
      const res = await goalsAPI.getAll();
      setGoals(res.data.data.goals || []);
    } catch {
      toast.error('Failed to load goals.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  /* ── Create / Edit ── */
  const openCreate = () => {
    setEditGoal(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (g) => {
    setEditGoal(g);
    setForm({
      title: g.title,
      targetAmount: g.targetAmount,
      deadline: g.deadline?.slice(0, 10) || '',
      category: g.category || 'Other',
      color: g.color || '#4f46e5',
      icon: g.icon || '🎯',
    });
    setModalOpen(true);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.title || !form.targetAmount) {
      return toast.error('Title and target amount required.');
    }
    setSaving(true);
    try {
      if (editGoal) {
        await goalsAPI.update(editGoal._id, form);
        toast.success('Goal updated.');
      } else {
        await goalsAPI.create(form);
        toast.success('Goal created!');
      }
      setModalOpen(false);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const promptDelete = (id) => {
    setGoalToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      await goalsAPI.delete(goalToDelete);
      toast.success('Goal deleted.');
      fetchGoals();
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleteModalOpen(false);
      setGoalToDelete(null);
    }
  };

  /* ── Contribute ── */
  const openContrib = (goal) => {
    setSelectedGoal(goal);
    setContribAmount('');
    setContribNote('');
    setContribModal(true);
  };

  const handleContribute = async () => {
    if (!contribAmount || Number(contribAmount) <= 0) {
      return toast.error('Enter a valid amount.');
    }
    setSaving(true);
    try {
      await goalsAPI.contribute(selectedGoal._id, {
        amount: Number(contribAmount),
        note: contribNote,
      });
      toast.success(`${fmt(contribAmount, user?.currency)} added to "${selectedGoal.title}"!`);
      setContribModal(false);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Contribution failed.');
    } finally {
      setSaving(false);
    }
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  /* ── Derived calculations ── */
  const active = goals.filter((g) => !g.isCompleted && g.currentAmount < g.targetAmount);
  const completed = goals.filter((g) => g.isCompleted || (g.targetAmount > 0 && g.currentAmount >= g.targetAmount));
  const displayed = tab === 'active' ? active : completed;

  const totalSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const totalStillToSave = active.reduce((s, g) => s + Math.max(g.targetAmount - g.currentAmount, 0), 0);

  const selectedRemaining = selectedGoal
    ? Math.max(selectedGoal.targetAmount - selectedGoal.currentAmount, 0)
    : 0;
  const contribNum = Number(contribAmount) || 0;
  const newAmount = selectedGoal ? Math.min(selectedGoal.currentAmount + contribNum, selectedGoal.targetAmount) : 0;

  /* ── Shimmer Skeleton Loading ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-4 w-60 bg-slate-200/70 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200/70 rounded-xl animate-pulse" />
        </div>

        {/* 3 KPI Summary Cards Skeleton */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-32 animate-pulse flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-28 bg-slate-200/70 rounded" />
                <div className="h-7 w-36 bg-slate-200/70 rounded-lg" />
                <div className="h-3 w-24 bg-slate-200/70 rounded" />
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-200/70" />
            </div>
          ))}
        </div>

        {/* 2-Column Grid Skeletons */}
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-64 animate-pulse flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-200/70" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 bg-slate-200/70 rounded" />
                  <div className="h-3 w-20 bg-slate-200/70 rounded" />
                </div>
              </div>
              <div className="h-2.5 w-full bg-slate-200/70 rounded-full" />
              <div className="h-16 w-full bg-slate-100 rounded-xl" />
              <div className="h-8 w-32 bg-slate-200/70 rounded-xl" />
            </div>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Savings Goals</h1>
          <p className="text-sm text-slate-500 mt-1">
            {goals.length > 0
              ? `${completed.length} of ${goals.length} goals reached`
              : 'Set systematic targets to build long-term wealth.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={16} /> New goal
        </button>
      </div>

      {/* ── 2. Top 3 KPI Summary Cards ── */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Card 1: OVERALL PROGRESS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              OVERALL PROGRESS
            </span>
            <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {overallPct}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {fmt(totalSaved, user?.currency)} of {fmt(totalTarget, user?.currency)}
            </p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                className="text-slate-100 stroke-current"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                className="text-indigo-600 stroke-current transition-all duration-700"
                strokeWidth="4"
                strokeDasharray={113.1}
                strokeDashoffset={113.1 - (overallPct / 100) * 113.1}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-slate-800">{overallPct}%</span>
          </div>
        </div>

        {/* Card 2: GOALS COMPLETED */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              GOALS COMPLETED
            </span>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight mt-1">
              {completed.length} / {goals.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {active.length} active in progress
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Trophy size={22} />
          </div>
        </div>

        {/* Card 3: STILL TO SAVE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              STILL TO SAVE
            </span>
            <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {fmt(totalStillToSave, user?.currency)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Needed to hit all active goals
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <PiggyBank size={22} />
          </div>
        </div>
      </div>

      {/* ── Segmented Tabs ── */}
      <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-xl">
        {[
          { key: 'active', label: 'Active', count: active.length },
          { key: 'completed', label: 'Completed', count: completed.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              tab === key
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
            <span
              className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                tab === key ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── 3. 2-Column FinTech Vault Grid ── */}
      {displayed.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Target size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {tab === 'active' ? 'No active goals' : 'No completed goals yet'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              {tab === 'active'
                ? 'Set a savings target and start contributing systematically.'
                : 'Keep contributing — reached goals will appear here.'}
            </p>
          </div>
          {tab === 'active' && (
            <button
              type="button"
              onClick={openCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={15} /> Add Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {displayed.map((g) => (
            <GoalCard
              key={g._id}
              goal={g}
              onEdit={openEdit}
              onDelete={promptDelete}
              onContribute={openContrib}
              currency={user?.currency}
            />
          ))}
        </div>
      )}

      {/* ── 4. Create / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editGoal ? 'Edit goal' : 'New savings goal'}
      >
        <div className="space-y-4">
          <Input
            label="Goal title"
            placeholder="e.g. Emergency Fund"
            value={form.title}
            onChange={setF('title')}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700">Target amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="1"
                  placeholder="5,000"
                  value={form.targetAmount}
                  onChange={setF('targetAmount')}
                  className="input-field pl-7"
                />
              </div>
            </div>
            <Input
              label="Deadline (optional)"
              type="date"
              value={form.deadline}
              onChange={setF('deadline')}
            />
          </div>

          <Select label="Category" value={form.category} onChange={setF('category')}>
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </Select>

          <div className="flex gap-3 items-end">
            <Input
              label="Icon (emoji)"
              placeholder="🎯"
              value={form.icon}
              onChange={setF('icon')}
              className="flex-1"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={setF('color')}
                className="h-10 w-14 rounded-xl border border-slate-200 p-1 bg-white cursor-pointer"
              />
            </div>
          </div>

          {/* Live preview */}
          {form.title && form.targetAmount && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-2xl">{form.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{form.title}</p>
                <p className="text-xs text-slate-500">
                  {form.category} · Target {fmt(form.targetAmount, user?.currency)}
                </p>
              </div>
            </div>
          )}

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
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-4 py-2 text-sm shadow-xs transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Saving…</span>
                </>
              ) : editGoal ? (
                'Save Changes'
              ) : (
                'Create Goal'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 5. Contribution / Deposit Modal ── */}
      <Modal
        isOpen={contribModal}
        onClose={() => setContribModal(false)}
        title={`Add to "${selectedGoal?.title}"`}
        size="sm"
      >
        <div className="space-y-4">
          {selectedGoal && (
            <>
              {/* Progress snapshot */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Current saved</span>
                  <span className="font-bold text-slate-900">
                    {fmt(selectedGoal.currentAmount, user?.currency)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{fmt(selectedRemaining, user?.currency)} remaining</span>
                  <span>Target: {fmt(selectedGoal.targetAmount, user?.currency)}</span>
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Quick amounts</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '$50', val: 50 },
                    { label: '$100', val: 100 },
                    { label: '$250', val: 250 },
                    { label: 'All', val: selectedRemaining },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setContribAmount(String(chip.val))}
                      className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-transparent rounded-xl py-2 text-xs font-semibold transition text-slate-700 cursor-pointer text-center"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700">Deposit amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    min="0.01"
                    placeholder="100"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    className="input-field pl-7"
                    autoFocus
                  />
                </div>
              </div>

              <Input
                label="Note (optional)"
                placeholder="e.g. Monthly savings contribution"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
              />

              {/* Live projection */}
              {contribNum > 0 && (
                <div className="space-y-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                    After contribution
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">New balance</span>
                    <span className="font-bold text-emerald-700">{fmt(newAmount, user?.currency)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-emerald-200/60 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((newAmount / selectedGoal.targetAmount) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setContribModal(false)}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContribute}
              disabled={saving || contribNum <= 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-semibold text-sm shadow-xs transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Depositing…</span>
                </>
              ) : (
                'Deposit'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 6. Delete Confirmation Modal ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        title="Delete this goal?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this savings goal? All contribution history will be permanently deleted.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setGoalToDelete(null);
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
              Delete goal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
