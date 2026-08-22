import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Target, Trash2, Pencil, CheckCircle, Clock, TrendingUp,
  DollarSign, AlertCircle, Trophy, PiggyBank, Sparkles,
} from 'lucide-react';
import { goalsAPI } from '../api/goals';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

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
        className={`h-full rounded-full transition-all duration-700 ${completed
          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
          : clampedPct >= 75
            ? 'bg-gradient-to-r from-teal-400 to-emerald-500'
            : clampedPct >= 40
              ? 'bg-gradient-to-r from-slate-400 to-teal-500'
              : 'bg-gradient-to-r from-slate-300 to-slate-400'
          }`}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}

/* ─── KPI Mini ────────────────────────────────────────────────── */
function KpiMini({ icon: Icon, label, value, sub, accent }) {
  const c = {
    emerald: { wrap: 'border-emerald-100 bg-emerald-50 text-emerald-600', val: 'text-emerald-600' },
    blue: { wrap: 'border-blue-100 bg-blue-50 text-blue-600', val: 'text-blue-600' },
    violet: { wrap: 'border-violet-100 bg-violet-50 text-violet-600', val: 'text-violet-600' },
    slate: { wrap: 'border-slate-200 bg-slate-50 text-slate-500', val: 'text-slate-700' },
  }[accent] || {};
  return (
    <div className="card flex flex-col gap-2 py-4 items-center text-center hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <span className={`w-10 h-10 flex items-center justify-center rounded-xl border ${c.wrap}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className={`text-xl font-bold ${c.val}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
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
    red: 'text-red-500',
    amber: 'text-amber-500',
    slate: 'text-slate-400',
  };

  if (goal.isCompleted) {
    return (
      <div className="card border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white relative overflow-hidden">
        {/* Completed ribbon */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle size={11} /> Completed
          </span>
        </div>

        <div className="flex items-start gap-3 pr-24">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50 border border-emerald-100">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">{goal.title}</h3>
            <span className="text-xs text-slate-400 capitalize">{goal.category}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-emerald-600">{fmt(goal.currentAmount, currency)}</span>
            <span className="text-slate-400">of {fmt(goal.targetAmount, currency)}</span>
          </div>
          <ProgressBar pct={100} completed />
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Trophy size={11} /> 100% achieved
            </span>
            <span className="text-slate-400">{goal.contributions?.length || 0} contributions</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle size={12} /> Goal reached!
          </p>
          <button
            onClick={() => onDelete(goal._id)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            title="Delete"
            aria-label="Delete goal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 bg-slate-50 border border-slate-200">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{goal.title}</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 mt-1">
            {goal.category}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            title="Edit"
            aria-label="Edit goal"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(goal._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            title="Delete"
            aria-label="Delete goal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Amounts */}
      <div className="mt-4 space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-slate-800 leading-none">{fmt(goal.currentAmount, currency)}</p>
            <p className="text-xs text-slate-400 mt-0.5">saved of {fmt(goal.targetAmount, currency)}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold leading-none ${pct >= 75 ? 'text-emerald-600' : pct >= 40 ? 'text-teal-600' : 'text-slate-600'}`}>
              {pct.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400 mt-0.5">achieved</p>
          </div>
        </div>

        <ProgressBar pct={pct} completed={false} />

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{fmt(remaining, currency)} to go</span>
          <span>{goal.contributions?.length || 0} contributions</span>
        </div>
      </div>

      {/* Footer: deadline + CTA */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="space-y-0.5">
          {dl ? (
            <p className={`text-xs flex items-center gap-1 font-medium ${toneClass[dl.tone]}`}>
              {dl.tone === 'red' ? <AlertCircle size={12} /> : <Clock size={12} />}
              {dl.label}
            </p>
          ) : (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={12} /> No deadline
            </p>
          )}
          {goal.deadline && (
            <p className="text-[10px] text-slate-400">
              {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => onContribute(goal)}>
          <TrendingUp size={13} /> Contribute
        </Button>
      </div>
    </div>
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

  /* ── Fetch ── */
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

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  /* ── Create / Edit ── */
  const openCreate = () => { setEditGoal(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (g) => {
    setEditGoal(g);
    setForm({ title: g.title, targetAmount: g.targetAmount, deadline: g.deadline?.slice(0, 10) || '', category: g.category, color: g.color || '#10b981', icon: g.icon || '🎯' });
    setModalOpen(true);
  };

  /* ── Save (validation unchanged) ── */
  const handleSave = async () => {
    if (!form.title || !form.targetAmount) return toast.error('Title and target amount required.');
    setSaving(true);
    try {
      if (editGoal) { await goalsAPI.update(editGoal._id, form); toast.success('Goal updated.'); }
      else { await goalsAPI.create(form); toast.success('Goal created!'); }
      setModalOpen(false);
      fetchGoals();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try { await goalsAPI.delete(id); toast.success('Goal deleted.'); fetchGoals(); }
    catch { toast.error('Delete failed.'); }
  };

  /* ── Contribute ── */
  const openContrib = (goal) => { setSelectedGoal(goal); setContribAmount(''); setContribNote(''); setContribModal(true); };

  const handleContribute = async () => {
    if (!contribAmount || Number(contribAmount) <= 0) return toast.error('Enter a valid amount.');
    setSaving(true);
    try {
      await goalsAPI.contribute(selectedGoal._id, { amount: Number(contribAmount), note: contribNote });
      toast.success(`${fmt(contribAmount, user?.currency)} added to "${selectedGoal.title}"!`);
      setContribModal(false);
      fetchGoals();
    } catch (err) { toast.error(err.response?.data?.message || 'Contribution failed.'); }
    finally { setSaving(false); }
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  /* ── Derived ── */
  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);
  const displayed = tab === 'active' ? active : completed;
  const totalSaved = active.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  /* ── Contribution preview ── */
  const contribNum = Number(contribAmount) || 0;
  const newAmount = selectedGoal ? Math.min(selectedGoal.currentAmount + contribNum, selectedGoal.targetAmount) : 0;
  const newRemaining = selectedGoal ? Math.max(selectedGoal.targetAmount - newAmount, 0) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Loading goals…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Savings Goals</h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            Every contribution brings you closer to financial freedom.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto shrink-0">
          <Plus size={16} /> Create Goal
        </Button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiMini icon={Target} label="Active Goals" value={active.length} accent="emerald" />
        <KpiMini
          icon={PiggyBank}
          label="Total Saved"
          value={fmt(totalSaved, user?.currency)}
          sub={`${overallPct}% of target`}
          accent="blue"
        />
        <KpiMini icon={Trophy} label="Completed" value={completed.length} accent="violet" />
      </div>

      {/* ── Segmented Tabs ── */}
      <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
        {[
          { key: 'active', label: 'Active', count: active.length },
          { key: 'completed', label: 'Completed', count: completed.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${tab === key
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
            <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
              ${tab === key ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/60 text-slate-400'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Goals Grid ── */}
      {displayed.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <Target size={28} className="text-slate-300" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700">
              {tab === 'active' ? 'No active goals' : 'No completed goals yet'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {tab === 'active'
                ? 'Set a savings target and start working toward it.'
                : 'Keep contributing — completed goals will appear here.'}
            </p>
          </div>
          {tab === 'active' && (
            <Button onClick={openCreate} size="sm"><Plus size={14} /> Create Goal</Button>
          )}
        </div>
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

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editGoal ? 'Edit Goal' : 'New Goal'}>
        <div className="space-y-4">

          {/* Title + Target */}
          <Input label="Goal title" placeholder="e.g. Emergency Fund" value={form.title} onChange={setF('title')} />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Target amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number" min="1" placeholder="5,000"
                  value={form.targetAmount}
                  onChange={setF('targetAmount')}
                  className="input-field pl-7"
                />
              </div>
            </div>
            <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={setF('deadline')} />
          </div>

          <Select label="Category" value={form.category} onChange={setF('category')}>
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </Select>

          <div className="flex gap-3 items-end">
            <Input label="Icon (emoji)" placeholder="🎯" value={form.icon} onChange={setF('icon')} className="flex-1" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Color</label>
              <input
                type="color" value={form.color} onChange={setF('color')}
                className="h-10 w-14 rounded-xl border border-slate-200 p-1 bg-white cursor-pointer"
              />
            </div>
          </div>

          {/* Live preview */}
          {form.title && form.targetAmount && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-2xl">{form.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{form.title}</p>
                <p className="text-xs text-slate-400">{form.category} · Target {fmt(form.targetAmount, user?.currency)}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Contribution Modal ── */}
      <Modal
        isOpen={contribModal}
        onClose={() => setContribModal(false)}
        title={`Contribute to "${selectedGoal?.title}"`}
        size="sm"
      >
        <div className="space-y-4">
          {selectedGoal && (
            <>
              {/* Progress snapshot */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current saved</span>
                  <span className="font-semibold text-slate-700">{fmt(selectedGoal.currentAmount, user?.currency)}</span>
                </div>
                <ProgressBar
                  pct={Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100)}
                  completed={false}
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{fmt(selectedGoal.targetAmount - selectedGoal.currentAmount, user?.currency)} remaining</span>
                  <span>of {fmt(selectedGoal.targetAmount, user?.currency)}</span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Amount input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Contribution amount</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number" min="0.01" placeholder="100"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    className="input-field pl-8"
                    autoFocus
                  />
                </div>
              </div>

              <Input
                label="Note (optional)"
                placeholder="e.g. Monthly savings"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
              />

              {/* Live projection */}
              {contribNum > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">After contribution</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">New total</span>
                    <span className="font-bold text-emerald-700">{fmt(newAmount, user?.currency)}</span>
                  </div>
                  <ProgressBar
                    pct={Math.min((newAmount / selectedGoal.targetAmount) * 100, 100)}
                    completed={newAmount >= selectedGoal.targetAmount}
                  />
                  {newRemaining > 0 ? (
                    <p className="text-xs text-slate-500">{fmt(newRemaining, user?.currency)} still remaining</p>
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Goal will be completed!
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setContribModal(false)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleContribute} disabled={saving || contribNum <= 0}>
              {saving ? 'Saving…' : 'Add Contribution'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
