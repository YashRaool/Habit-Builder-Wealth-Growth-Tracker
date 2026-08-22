import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Flame, Trash2, Pencil, Trophy, Zap, Archive, ArchiveRestore,
  Clock, DollarSign, Target, ChevronDown, ChevronUp, MoreVertical,
  CheckCheck, Circle, TrendingUp, Sparkles,
} from 'lucide-react';
import { habitsAPI } from '../api/habits';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

/* ─── Presets (not hardcoded into saved data) ─────────────────── */
const PRESET_HABITS = [
  { title: 'Save $5/day', icon: '💰', color: '#10b981', frequency: 'daily', targetAmount: 5 },
  { title: 'Check Bank App', icon: '📱', color: '#6366f1', frequency: 'daily' },
  { title: 'No Takeout Day', icon: '🥗', color: '#f59e0b', frequency: 'daily' },
  { title: 'Read 10 mins Finance', icon: '📚', color: '#3b82f6', frequency: 'daily' },
  { title: 'Review budget', icon: '📊', color: '#14b8a6', frequency: 'weekly' },
  { title: 'Invest weekly', icon: '📈', color: '#8b5cf6', frequency: 'weekly', targetAmount: 50 },
];

const EMPTY_FORM = {
  title: '', frequency: 'daily', targetAmount: '', reminderTime: '', color: '#10b981', icon: '💰',
};

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* ─── Helpers ─────────────────────────────────────────────────── */
function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function buildLast7(logs) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const log = logs?.find((l) => isSameDay(l.date, d));
    return { date: d, completed: log?.completed || false, isToday: i === 6 };
  });
}

function buildLast30(logs) {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    const log = logs?.find((l) => isSameDay(l.date, d));
    return { date: d, completed: log?.completed || false, isToday: i === 29 };
  });
}

/* ─── 7-Day Strip ─────────────────────────────────────────────── */
function SevenDayStrip({ logs }) {
  const days = buildLast7(logs);
  return (
    <div className="flex gap-1.5">
      {days.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-medium text-slate-400">{DAY_LABELS[day.date.getDay()]}</span>
          <div
            title={`${day.date.toLocaleDateString()} — ${day.completed ? 'Completed' : 'Missed'}`}
            aria-label={`${day.date.toLocaleDateString()}: ${day.completed ? 'completed' : 'missed'}`}
            className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-200
              ${day.completed
                ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                : day.isToday
                  ? 'border-2 border-dashed border-slate-300'
                  : 'bg-slate-100'
              }`}
          >
            {day.completed && <CheckCheck size={11} className="text-white" />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── 30-Day Heatmap ──────────────────────────────────────────── */
function MonthlyHeatmap({ logs }) {
  const days = buildLast30(logs);
  const completed = days.filter((d) => d.completed).length;
  const pct = Math.round((completed / 30) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">30-Day Activity</span>
        <span className="text-xs font-semibold text-slate-600">{completed}/30 days · {pct}%</span>
      </div>
      <div className="flex gap-[3px] flex-wrap">
        {days.map((day, i) => (
          <div
            key={i}
            title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.completed ? '✓' : '–'}`}
            aria-label={`${day.date.toLocaleDateString()}: ${day.completed ? 'completed' : 'missed'}`}
            className={`w-3 h-3 rounded-[3px] transition-colors duration-150
              ${day.completed
                ? day.isToday ? 'bg-emerald-600' : 'bg-emerald-400'
                : day.isToday ? 'bg-slate-300 ring-1 ring-slate-400' : 'bg-slate-100'
              }`}
          />
        ))}
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Milestone Badges ────────────────────────────────────────── */
const MILESTONES = [
  { min: 100, label: '100-Day Legend', icon: '🏆', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { min: 30, label: '30-Day Master', icon: '⚡', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { min: 14, label: '2-Week Streak', icon: '🔥', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { min: 7, label: '7-Day Discipline', icon: '🌟', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

function MilestoneBadges({ streak }) {
  const earned = MILESTONES.filter((m) => streak >= m.min);
  if (!earned.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {earned.map((m) => (
        <span
          key={m.min}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.color}`}
        >
          {m.icon} {m.label}
        </span>
      ))}
    </div>
  );
}

/* ─── KPI Mini Card ───────────────────────────────────────────── */
function KpiMini({ icon: Icon, label, value, accent }) {
  const colors = {
    orange: 'text-orange-500 bg-orange-50 border-orange-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
  };
  return (
    <div className="card flex flex-col items-center gap-2 py-4 text-center hover:shadow-md transition-all duration-200">
      <span className={`w-10 h-10 flex items-center justify-center rounded-xl border ${colors[accent]}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className={`text-2xl font-bold ${accent === 'orange' ? 'text-orange-500' : accent === 'violet' ? 'text-violet-600' : 'text-emerald-600'}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ─── Action Menu ─────────────────────────────────────────────── */
function CardMenu({ onEdit, onArchive, onDelete, archived }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-label="Habit options"
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-fade-in">
          {onEdit && (
            <button onClick={() => { setOpen(false); onEdit(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Pencil size={13} /> Edit
            </button>
          )}
          <button onClick={() => { setOpen(false); onArchive(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
            {archived ? 'Reactivate' : 'Archive'}
          </button>
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Habit Card ──────────────────────────────────────────────── */
function HabitCard({ habit, onCheckIn, checkingIn, onEdit, onArchive, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const checkedToday = habit.logs?.some((l) => isSameDay(l.date, new Date()) && l.completed);
  const isChecking = checkingIn === habit._id;

  const streakRatio = habit.longestStreak > 0
    ? Math.min((habit.currentStreak / habit.longestStreak) * 100, 100)
    : 0;

  return (
    <div className={`card overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300
      ${checkedToday ? 'border-emerald-200 bg-emerald-50/30' : ''}`}
    >
      {/* Top: icon + title + menu */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
          style={{ backgroundColor: `${habit.color}18`, border: `1.5px solid ${habit.color}30` }}
        >
          {habit.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 leading-snug truncate pr-1">{habit.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
              {habit.frequency}
            </span>
            {habit.targetAmount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <DollarSign size={10} />{habit.targetAmount}/check-in
              </span>
            )}
            {habit.reminderTime && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                <Clock size={10} />{habit.reminderTime}
              </span>
            )}
          </div>
        </div>
        <CardMenu
          onEdit={() => onEdit(habit)}
          onArchive={() => onArchive(habit)}
          onDelete={() => onDelete(habit._id)}
          archived={false}
        />
      </div>

      {/* 7-Day strip */}
      <div className="mt-4">
        <SevenDayStrip logs={habit.logs} />
      </div>

      {/* Streak + Check-in row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-orange-500">
              <Flame size={14} />
              <span className="text-lg font-bold leading-none">{habit.currentStreak}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">current</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-slate-500">
              <Zap size={13} />
              <span className="text-lg font-bold leading-none">{habit.longestStreak}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">best</p>
          </div>
          {/* Streak progress mini bar */}
          {habit.longestStreak > 0 && (
            <div className="hidden sm:flex flex-col gap-1 min-w-[60px]">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${streakRatio}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">{Math.round(streakRatio)}% of best</span>
            </div>
          )}
        </div>

        {/* Primary check-in toggle */}
        <button
          onClick={() => onCheckIn(habit)}
          disabled={isChecking}
          aria-label={checkedToday ? 'Undo check-in' : 'Check in today'}
          className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
            ${checkedToday
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 focus:ring-emerald-400 active:scale-95'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:ring-emerald-300 active:scale-95'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isChecking ? (
            <Spinner size="sm" />
          ) : checkedToday ? (
            <>
              <CheckCheck size={15} />
              <span>Done!</span>
            </>
          ) : (
            <>
              <Circle size={15} />
              <span>Check In</span>
            </>
          )}
        </button>
      </div>

      {/* Expand/Collapse: milestones + heatmap */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mt-3 w-full justify-center"
        aria-expanded={expanded}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Less' : 'History & badges'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-4 animate-fade-in">
          <MilestoneBadges streak={habit.currentStreak} />
          <MonthlyHeatmap logs={habit.logs} />
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function Habits() {
  const toast = useToast();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await habitsAPI.getAll();
      setHabits(res.data.data.habits);
    } catch {
      toast.error('Failed to load habits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  /* ── Check-in (toggle) — preserves existing endpoint logic ── */
  const handleCheckIn = async (habit) => {
    const today = new Date().toDateString();
    const alreadyChecked = habit.logs?.some((l) => new Date(l.date).toDateString() === today && l.completed);
    setCheckingIn(habit._id);
    try {
      await habitsAPI.checkIn(habit._id);
      toast.success(alreadyChecked ? 'Check-in removed.' : `✅ "${habit.title}" checked in!`);
      fetchHabits();
    } catch {
      toast.error('Check-in failed.');
    } finally {
      setCheckingIn(null);
    }
  };

  /* ── Modal helpers ── */
  const openCreate = (preset = null) => {
    setEditHabit(null);
    setForm(preset ? { ...EMPTY_FORM, ...preset, targetAmount: preset.targetAmount || '' } : EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (h) => {
    setEditHabit(h);
    setForm({ title: h.title, frequency: h.frequency, targetAmount: h.targetAmount || '', reminderTime: h.reminderTime || '', color: h.color || '#10b981', icon: h.icon || '💰' });
    setFormError('');
    setModalOpen(true);
  };

  /* ── Save (validation unchanged) ── */
  const handleSave = async () => {
    if (!form.title.trim()) { setFormError('Habit title is required.'); return; }
    setFormError('');
    setSaving(true);
    try {
      if (editHabit) {
        await habitsAPI.update(editHabit._id, form);
        toast.success('Habit updated.');
      } else {
        await habitsAPI.create(form);
        toast.success('Habit created!');
      }
      setModalOpen(false);
      fetchHabits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this habit?')) return;
    try {
      await habitsAPI.delete(id);
      toast.success('Habit deleted.');
      setHabits((prev) => prev.filter((h) => h._id !== id));
    } catch { toast.error('Delete failed.'); }
  };

  /* ── Archive toggle ── */
  const handleToggleArchive = async (habit) => {
    try {
      await habitsAPI.update(habit._id, { isActive: !habit.isActive });
      toast.success(habit.isActive ? 'Habit archived.' : 'Habit reactivated.');
      fetchHabits();
    } catch { toast.error('Failed to update habit.'); }
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const activeHabits = habits.filter((h) => h.isActive);
  const archivedHabits = habits.filter((h) => !h.isActive);
  const totalStreak = activeHabits.reduce((s, h) => s + (h.currentStreak || 0), 0);
  const longestEver = Math.max(...habits.map((h) => h.longestStreak || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Loading habits…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Habits</h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            Small daily actions compound into lasting wealth.
          </p>
        </div>
        <Button onClick={() => openCreate()} className="self-start sm:self-auto shrink-0">
          <Plus size={16} /> Create Habit
        </Button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiMini icon={Flame} label="Combined Streaks" value={totalStreak} accent="orange" />
        <KpiMini icon={Target} label="Active Habits" value={activeHabits.length} accent="emerald" />
        <KpiMini icon={Trophy} label="Longest Streak" value={longestEver} accent="violet" />
      </div>

      {/* ── Active Habit Cards ── */}
      {activeHabits.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center">
            <Flame size={28} className="text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700">No habits yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Build consistent financial habits. Start with a preset below or create your own.
            </p>
          </div>
          <Button onClick={() => openCreate()} size="sm"><Plus size={14} /> Create Habit</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeHabits.map((h) => (
            <HabitCard
              key={h._id}
              habit={h}
              onCheckIn={handleCheckIn}
              checkingIn={checkingIn}
              onEdit={openEdit}
              onArchive={handleToggleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Quick Start Presets ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={13} /> Quick Start Presets
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESET_HABITS.map((p) => (
            <button
              key={p.title}
              onClick={() => openCreate(p)}
              className="card p-3 text-center hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm transition-all duration-200 cursor-pointer group"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-200">{p.icon}</div>
              <p className="text-xs text-slate-500 leading-snug font-medium group-hover:text-emerald-700">{p.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Archived ── */}
      {archivedHabits.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Archived Habits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-70">
            {archivedHabits.map((h) => (
              <div key={h._id} className="card border-slate-200 bg-slate-50 flex items-center gap-3">
                <div className="text-2xl grayscale opacity-60 shrink-0">{h.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 line-through decoration-slate-400 truncate">{h.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">{h.frequency}</p>
                </div>
                <CardMenu
                  onArchive={() => handleToggleArchive(h)}
                  onDelete={() => handleDelete(h._id)}
                  archived={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editHabit ? 'Edit Habit' : 'New Habit'}>
        <div className="space-y-4">

          {/* Preset picker (only in create mode) */}
          {!editHabit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Start from a preset</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_HABITS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => setForm({ ...EMPTY_FORM, ...p, targetAmount: p.targetAmount || '' })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all duration-150
                      ${form.title === p.title
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-xs font-medium leading-snug">{p.title}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">or enter manually</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="Habit title"
              placeholder="e.g. Save $5/day"
              value={form.title}
              onChange={setF('title')}
            />
            {formError && <p className="text-xs text-red-500">{formError}</p>}
          </div>

          {/* Frequency */}
          <Select label="Frequency" value={form.frequency} onChange={setF('frequency')}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>

          {/* Amount + Reminder */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target amount (optional)"
              type="number"
              min="0"
              placeholder="0"
              value={form.targetAmount}
              onChange={setF('targetAmount')}
            />
            <Input
              label="Reminder time (optional)"
              type="time"
              value={form.reminderTime}
              onChange={setF('reminderTime')}
            />
          </div>

          {/* Color + Icon */}
          <div className="flex gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={setF('color')}
                className="h-10 w-14 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white"
              />
            </div>
            <Input label="Icon (emoji)" placeholder="💰" value={form.icon} onChange={setF('icon')} className="flex-1" />
          </div>

          {/* Preview */}
          {form.title && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ backgroundColor: `${form.color}10`, borderColor: `${form.color}30` }}
            >
              <span className="text-xl">{form.icon}</span>
              <span className="text-sm font-medium text-slate-700">{form.title}</span>
              <span className="ml-auto text-xs text-slate-400 capitalize">{form.frequency}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editHabit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
