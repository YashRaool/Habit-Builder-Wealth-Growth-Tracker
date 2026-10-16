import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Target, Trash2, Pencil, CheckCircle, Clock, TrendingUp,
  DollarSign, AlertCircle, Trophy, PiggyBank, Sparkles,
} from 'lucide-react';
import { goalsAPI } from '../api/goals';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import PageHeader from '../components/layout/PageHeader';
import { StatCardSkeleton, CardSkeleton } from '../components/ui/Skeleton';

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
  title: '', targetAmount: '', deadline: '', category: 'Other', color: '#10b981', icon: '🎯',
};

/* ─── Deadline helper ─────────────────────────────────────────── */
function deadlineInfo(deadline) {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due - now) / 86400000);
  if (days > 0) return { label: `${days} day${days === 1 ? '' : 's'} remaining`, tone: days < 30 ? 'red' : days < 90 ? 'amber' : 'slate' };
  if (days === 0) return { label: 'Due today', tone: 'red' };
  return { label: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`, tone: 'red' };
}

/* ─── Progress bar ────────────────────────────────────────────── */
function ProgressBar({ pct, completed }) {
  const clampedPct = Math.min(pct, 100);
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          completed
            ? 'bg-emerald-600'
            : clampedPct >= 75
              ? 'bg-emerald-500'
              : clampedPct >= 40
                ? 'bg-teal-500'
                : 'bg-slate-400'
        }`}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}

/* ─── Goal Card ───────────────────────────────────────────────── */
function GoalCard({ goal, onEdit, onDelete, onContribute, currency }) {
  const pct = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;
  const dl = deadlineInfo(goal.deadline);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const icon = goal.icon || CATEGORY_ICONS[goal.category] || '🎯';

  const toneClass = {
    red: 'text-rose-600',
    amber: 'text-amber-600',
    slate: 'text-slate-500',
  };

  if (goal.isCompleted) {
    return (
      <Card className="border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 to-white relative overflow-hidden p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50 border border-emerald-200/60 shadow-xs">
                {icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate text-sm">{goal.title}</h3>
                <span className="text-2xs text-slate-500 capitalize">{goal.category}</span>
              </div>
            </div>
            <Badge color="emerald" size="sm">
              <CheckCircle size={11} /> 100% Achieved
            </Badge>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-700 tabular-nums">{fmt(goal.currentAmount, currency)}</span>
              <span className="text-slate-400 tabular-nums font-normal">Target: {fmt(goal.targetAmount, currency)}</span>
            </div>
            <ProgressBar pct={100} completed />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
          <p className="text-2xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle size={13} className="text-emerald-600" /> Capital Target Reached!
          </p>
          <button
            onClick={() => onDelete(goal._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            title="Delete goal"
            aria-label="Delete goal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 flex flex-col justify-between group hover:shadow-card hover:border-slate-300 transition-all duration-200">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-slate-50 border border-slate-200/80">
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate text-sm">{goal.title}</h3>
              <Badge color="slate" size="sm" variant="rounded" className="mt-1">
                {goal.category}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              title="Edit"
              aria-label="Edit goal"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(goal._id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              title="Delete"
              aria-label="Delete goal"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Saved Amounts & Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none tabular-nums">{fmt(goal.currentAmount, currency)}</p>
              <p className="text-2xs text-slate-400 mt-1 tabular-nums">saved of {fmt(goal.targetAmount, currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold leading-none text-emerald-700 tabular-nums">
                {pct.toFixed(1)}%
              </p>
              <p className="text-2xs text-slate-400 mt-1">funded</p>
            </div>
          </div>

          <ProgressBar pct={pct} completed={false} />

          <div className="flex items-center justify-between text-2xs text-slate-500 pt-0.5">
            <span className="tabular-nums font-medium">{fmt(remaining, currency)} remaining</span>
            <span className="tabular-nums">{goal.contributions?.length || 0} contributions</span>
          </div>
        </div>
      </div>

      {/* Footer: deadline + CTA */}
      <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100">
        <div className="space-y-0.5 min-w-0 pr-2">
          {dl ? (
            <p className={`text-xs flex items-center gap-1 font-semibold ${toneClass[dl.tone]}`}>
              {dl.tone === 'red' ? <AlertCircle size={12} /> : <Clock size={12} />}
              {dl.label}
            </p>
          ) : (
            <p className="text-2xs text-slate-400 flex items-center gap-1">
              <Clock size={11} /> Open-ended
            </p>
          )}
          {goal.deadline && (
            <p className="text-2xs text-slate-400 tabular-nums">
              Due: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => onContribute(goal)} className="shrink-0">
          <TrendingUp size={13} /> Add Funds
        </Button>
      </div>
    </Card>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function Goals() {
  const { user } = useAuth();
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [contribModal, setContribModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await goalsAPI.getAll();
      setGoals(res.data.data.goals);
    } catch {
      toast.error('Failed to load goals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

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
      category: g.category,
      color: g.color || '#10b981',
      icon: g.icon || '🎯',
    });
    setModalOpen(true);
  };

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await goalsAPI.delete(id);
      toast.success('Goal deleted.');
      fetchGoals();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const openContrib = (goal) => {
    setSelectedGoal(goal);
    setContribAmount('');
    setContribNote('');
    setContribModal(true);
  };

  const handleContribute = async () => {
    if (!contribAmount || Number(contribAmount) <= 0) {
      return toast.error('Enter a valid contribution amount.');
    }
    setSaving(true);
    try {
      await goalsAPI.contribute(selectedGoal._id, { amount: Number(contribAmount), note: contribNote });
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

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);
  const displayed = tab === 'active' ? active : completed;
  const totalSaved = active.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const contribNum = Number(contribAmount) || 0;
  const newAmount = selectedGoal ? Math.min(selectedGoal.currentAmount + contribNum, selectedGoal.targetAmount) : 0;
  const newRemaining = selectedGoal ? Math.max(selectedGoal.targetAmount - newAmount, 0) : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-slate-200/70 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} height="h-60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Capital Savings Goals"
        description="Structured milestone targets with continuous contribution tracking."
      >
        <Button onClick={openCreate} size="sm">
          <Plus size={15} /> Create Goal
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Target}
          label="Active Goals"
          value={<span className="tabular-nums">{active.length}</span>}
          color="emerald"
        />
        <StatCard
          icon={PiggyBank}
          label="Total Capital Saved"
          value={<span className="tabular-nums">{fmt(totalSaved, user?.currency)}</span>}
          sub={<span className="tabular-nums">{overallPct}% of target funded</span>}
          color="blue"
        />
        <StatCard
          icon={Trophy}
          label="Fully Funded Goals"
          value={<span className="tabular-nums">{completed.length}</span>}
          color="violet"
        />
      </div>

      {/* Segmented Filter Pills */}
      <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/90 p-1 rounded-xl">
        {[
          { key: 'active', label: 'Active Targets', count: active.length },
          { key: 'completed', label: 'Completed', count: completed.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
              ${
                tab === key
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            {label}
            <span
              className={`ml-1.5 text-2xs font-bold px-1.5 py-0.5 rounded-full tabular-nums
              ${tab === key ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'}`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {displayed.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
            <Target size={26} className="text-slate-300" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              {tab === 'active' ? 'No active goals in progress' : 'No completed goals yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {tab === 'active'
                ? 'Establish a target fund for travel, emergencies, or large investments.'
                : 'Keep contributing — completed goals automatically archive here.'}
            </p>
          </div>
          {tab === 'active' && (
            <Button onClick={openCreate} size="sm"><Plus size={14} /> Create Goal</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((g) => (
            <GoalCard
              key={g._id}
              goal={g}
              onEdit={openEdit}
              onDelete={handleDelete}
              onContribute={openContrib}
              currency={user?.currency}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editGoal ? 'Edit Goal' : 'Create Savings Goal'}>
        <div className="space-y-4">
          <Input
            label="Goal title"
            placeholder="e.g. 6-Month Emergency Reserve"
            value={form.title}
            onChange={setF('title')}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target amount ($)"
              type="number"
              min="1"
              placeholder="10,000.00"
              value={form.targetAmount}
              onChange={setF('targetAmount')}
              disabled={saving}
            />
            <Input
              label="Target Deadline"
              type="date"
              value={form.deadline}
              onChange={setF('deadline')}
              disabled={saving}
            />
          </div>

          <Select label="Category" value={form.category} onChange={setF('category')} disabled={saving}>
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
              disabled={saving}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={setF('color')}
                disabled={saving}
                className="h-10 w-14 rounded-xl border border-slate-200 p-1 bg-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editGoal ? 'Save Updates' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        isOpen={contribModal}
        onClose={() => setContribModal(false)}
        title={`Add Funds to "${selectedGoal?.title}"`}
        size="sm"
      >
        <div className="space-y-4">
          {selectedGoal && (
            <>
              <div className="space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current saved</span>
                  <span className="font-bold text-slate-900 tabular-nums">{fmt(selectedGoal.currentAmount, user?.currency)}</span>
                </div>
                <ProgressBar
                  pct={Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100)}
                  completed={false}
                />
                <div className="flex justify-between text-2xs text-slate-400">
                  <span className="tabular-nums font-medium text-emerald-700">
                    {fmt(selectedGoal.targetAmount - selectedGoal.currentAmount, user?.currency)} remaining
                  </span>
                  <span className="tabular-nums">of {fmt(selectedGoal.targetAmount, user?.currency)}</span>
                </div>
              </div>

              <Input
                label="Contribution amount ($)"
                type="number"
                min="0.01"
                placeholder="250.00"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                disabled={saving}
                autoFocus
              />

              <Input
                label="Note (optional)"
                placeholder="e.g. Dividend reinvestment"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
                disabled={saving}
              />

              {contribNum > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 animate-fade-in text-xs">
                  <p className="text-2xs font-bold text-emerald-800 uppercase tracking-wider">Projected Total</p>
                  <div className="flex justify-between">
                    <span className="text-slate-600">New Funded Amount</span>
                    <span className="font-bold text-emerald-800 tabular-nums">{fmt(newAmount, user?.currency)}</span>
                  </div>
                  <ProgressBar
                    pct={Math.min((newAmount / selectedGoal.targetAmount) * 100, 100)}
                    completed={newAmount >= selectedGoal.targetAmount}
                  />
                  {newRemaining > 0 ? (
                    <p className="text-2xs text-slate-500 tabular-nums">{fmt(newRemaining, user?.currency)} still remaining</p>
                  ) : (
                    <p className="text-2xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle size={13} /> Target reached with this contribution!
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-2.5 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setContribModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              onClick={handleContribute}
              disabled={saving || contribNum <= 0}
            >
              {saving ? 'Processing...' : 'Confirm Contribution'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
