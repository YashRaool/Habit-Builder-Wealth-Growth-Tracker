import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Flame, Trash2, Pencil, Trophy, Zap, Archive, ArchiveRestore,
  Clock, DollarSign, Target, ChevronDown, ChevronUp, MoreVertical,
  CheckCheck, Circle, TrendingUp, Sparkles,
} from 'lucide-react';
import { habitsAPI } from '../api/habits';
import { useToast } from '../context/ToastContext';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import PageHeader from '../components/layout/PageHeader';
import { StatCardSkeleton, CardSkeleton } from '../components/ui/Skeleton';

/* ─── Presets ─────────────────────────────────────────────────── */
const PRESET_HABITS = [
  { title: 'Save $5/day', icon: '💰', color: '#10b981', frequency: 'daily', targetAmount: 5 },
  { title: 'Check Bank App', icon: '📱', color: '#6366f1', frequency: 'daily' },
  { title: 'No Takeout Day', icon: '🥗', color: '#f59e0b', frequency: 'daily' },
  { title: 'Read 10 mins Finance', icon: '📚', color: '#0ea5e9', frequency: 'daily' },
  { title: 'Review budget', icon: '📊', color: '#14b8a6', frequency: 'weekly' },
  { title: 'Invest weekly', icon: '📈', color: '#8b5cf6', frequency: 'weekly', targetAmount: 50 },
];

const EMPTY_FORM = {
  title: '', frequency: 'daily', targetAmount: '', reminderTime: '', color: '#10b981', icon: '💰',
};

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
          <span className="text-2xs font-semibold text-slate-400">{DAY_LABELS[day.date.getDay()]}</span>
          <div
            title={`${day.date.toLocaleDateString()} — ${day.completed ? 'Completed' : 'Missed'}`}
            aria-label={`${day.date.toLocaleDateString()}: ${day.completed ? 'completed' : 'missed'}`}
            className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-150 border
              ${
                day.completed
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : day.isToday
                    ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/30'
                    : 'bg-slate-100/80 border-slate-200/80'
              }`}
          >
            {day.completed && <CheckCheck size={11} className="stroke-[2.5]" />}
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
        <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">30-Day Activity</span>
        <span className="text-2xs font-bold text-slate-700 tabular-nums">{completed}/30 days · {pct}%</span>
      </div>
      <div className="flex gap-[3px] flex-wrap">
        {days.map((day, i) => (
          <div
            key={i}
            title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.completed ? '✓' : '–'}`}
            aria-label={`${day.date.toLocaleDateString()}: ${day.completed ? 'completed' : 'missed'}`}
            className={`w-3 h-3 rounded-[3px] transition-colors duration-150
              ${
                day.completed
                  ? day.isToday ? 'bg-emerald-600 ring-1 ring-emerald-400' : 'bg-emerald-500'
                  : day.isToday ? 'bg-slate-300 ring-1 ring-slate-400' : 'bg-slate-100'
              }`}
          />
        ))}
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Milestone Badges ────────────────────────────────────────── */
const MILESTONES = [
  { min: 100, label: '100-Day Legend', icon: '🏆', color: 'bg-amber-50 text-amber-700 border-amber-200/70' },
  { min: 30, label: '30-Day Master', icon: '⚡', color: 'bg-violet-50 text-violet-700 border-violet-200/70' },
  { min: 14, label: '2-Week Streak', icon: '🔥', color: 'bg-orange-50 text-orange-700 border-orange-200/70' },
  { min: 7, label: '7-Day Discipline', icon: '🌟', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
];

function MilestoneBadges({ streak }) {
  const earned = MILESTONES.filter((m) => streak >= m.min);
  if (!earned.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {earned.map((m) => (
        <span
          key={m.min}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${m.color}`}
        >
          {m.icon} {m.label}
        </span>
      ))}
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
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        aria-label="Habit options"
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200/90 rounded-xl shadow-elevated py-1 animate-fade-in">
          {onEdit && (
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={13} className="text-slate-400" /> Edit Habit
            </button>
          )}
          <button
            onClick={() => { setOpen(false); onArchive(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {archived ? <ArchiveRestore size={13} className="text-slate-400" /> : <Archive size={13} className="text-slate-400" />}
            {archived ? 'Reactivate' : 'Archive'}
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} className="text-rose-500" /> Delete
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
    <Card
      className={`overflow-hidden transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between
        ${checkedToday ? 'border-emerald-200 bg-emerald-50/20 shadow-xs' : ''}`}
    >
      <div>
        {/* Top: icon + title + menu */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
            style={{ backgroundColor: `${habit.color}15`, borderColor: `${habit.color}35` }}
          >
            {habit.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 leading-snug truncate text-sm">{habit.title}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge color="slate" size="sm" variant="rounded">
                {habit.frequency}
              </Badge>
              {habit.targetAmount > 0 && (
                <Badge color="emerald" size="sm" variant="rounded">
                  <DollarSign size={10} />{habit.targetAmount}/check-in
                </Badge>
              )}
              {habit.reminderTime && (
                <Badge color="blue" size="sm" variant="rounded">
                  <Clock size={10} />{habit.reminderTime}
                </Badge>
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
      </div>

      {/* Streak + Check-in row */}
      <div className="mt-4">
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="flex items-center gap-1 text-amber-600">
                <Flame size={14} className="text-amber-500" />
                <span className="text-base font-bold tabular-nums leading-none">{habit.currentStreak}</span>
              </div>
              <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Current</p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-slate-600">
                <Zap size={13} className="text-slate-400" />
                <span className="text-base font-bold tabular-nums leading-none">{habit.longestStreak}</span>
              </div>
              <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Best</p>
            </div>
            {habit.longestStreak > 0 && (
              <div className="hidden sm:flex flex-col gap-1 min-w-[60px]">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${streakRatio}%` }}
                  />
                </div>
                <span className="text-2xs text-slate-400 tabular-nums">{Math.round(streakRatio)}% of best</span>
              </div>
            )}
          </div>

          {/* Primary check-in button */}
          <button
            onClick={() => onCheckIn(habit)}
            disabled={isChecking}
            aria-label={checkedToday ? 'Undo check-in' : 'Check in today'}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              ${
                checkedToday
                  ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
          >
            {isChecking ? (
              <Spinner size="sm" />
            ) : checkedToday ? (
              <>
                <CheckCheck size={14} />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Circle size={14} />
                <span>Check In</span>
              </>
            )}
          </button>
        </div>

        {/* Expand/Collapse history */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-2xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mt-3 w-full justify-center pt-1"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide History' : 'Activity Details'}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3.5 animate-fade-in">
            <MilestoneBadges streak={habit.currentStreak} />
            <MonthlyHeatmap logs={habit.logs} />
          </div>
        )}
      </div>
    </Card>
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

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleCheckIn = async (habit) => {
    const today = new Date().toDateString();
    const alreadyChecked = habit.logs?.some((l) => new Date(l.date).toDateString() === today && l.completed);
    setCheckingIn(habit._id);
    try {
      await habitsAPI.checkIn(habit._id);
      toast.success(alreadyChecked ? 'Check-in removed.' : `"${habit.title}" checked in!`);
      fetchHabits();
    } catch {
      toast.error('Check-in failed.');
    } finally {
      setCheckingIn(null);
    }
  };

  const openCreate = (preset = null) => {
    setEditHabit(null);
    setForm(preset ? { ...EMPTY_FORM, ...preset, targetAmount: preset.targetAmount || '' } : EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (h) => {
    setEditHabit(h);
    setForm({
      title: h.title,
      frequency: h.frequency,
      targetAmount: h.targetAmount || '',
      reminderTime: h.reminderTime || '',
      color: h.color || '#10b981',
      icon: h.icon || '💰',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError('Habit title is required.');
      return;
    }
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this habit?')) return;
    try {
      await habitsAPI.delete(id);
      toast.success('Habit deleted.');
      setHabits((prev) => prev.filter((h) => h._id !== id));
    } catch {
      toast.error('Delete failed.');
    }
  };

  const handleToggleArchive = async (habit) => {
    try {
      await habitsAPI.update(habit._id, { isActive: !habit.isActive });
      toast.success(habit.isActive ? 'Habit archived.' : 'Habit reactivated.');
      fetchHabits();
    } catch {
      toast.error('Failed to update habit.');
    }
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const activeHabits = habits.filter((h) => h.isActive);
  const archivedHabits = habits.filter((h) => !h.isActive);
  const totalStreak = activeHabits.reduce((s, h) => s + (h.currentStreak || 0), 0);
  const longestEver = Math.max(...habits.map((h) => h.longestStreak || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-2">
            <div className="h-8 w-60 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-slate-200/70 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} height="h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Financial Habits & Streaks"
        description="Daily behavioral micro-actions that systematically compound into wealth."
      >
        <Button onClick={() => openCreate()} size="sm">
          <Plus size={15} /> Create Habit
        </Button>
      </PageHeader>

      {/* KPI Cards with tabular numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Flame}
          label="Cumulative Streak"
          value={<span className="tabular-nums">{totalStreak} days</span>}
          color="amber"
        />
        <StatCard
          icon={Target}
          label="Active Disciplines"
          value={<span className="tabular-nums">{activeHabits.length} habits</span>}
          color="emerald"
        />
        <StatCard
          icon={Trophy}
          label="All-Time Longest"
          value={<span className="tabular-nums">{longestEver} days</span>}
          color="violet"
        />
      </div>

      {/* Active Habit Cards */}
      {activeHabits.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Flame size={26} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">No active habits yet</h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
              Select one of the curated presets below or create a custom recurring discipline.
            </p>
          </div>
          <Button onClick={() => openCreate()} size="sm"><Plus size={14} /> Create Habit</Button>
        </Card>
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

      {/* Quick Start Presets */}
      <div>
        <h2 className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp size={13} className="text-emerald-600" /> Recommended Action Presets
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESET_HABITS.map((p) => (
            <button
              key={p.title}
              onClick={() => openCreate(p)}
              className="p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-card transition-all duration-200 text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-200">{p.icon}</div>
              <p className="text-xs text-slate-700 leading-snug font-medium group-hover:text-emerald-800">{p.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Archived Section */}
      {archivedHabits.length > 0 && (
        <div className="pt-2">
          <h2 className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Archived Habits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-75">
            {archivedHabits.map((h) => (
              <div key={h._id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                <div className="text-xl grayscale opacity-70 shrink-0">{h.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-600 line-through truncate">{h.title}</p>
                  <p className="text-2xs text-slate-400 mt-0.5 capitalize">{h.frequency}</p>
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

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editHabit ? 'Edit Habit' : 'Create New Habit'}>
        <div className="space-y-4">
          {!editHabit && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Choose a preset</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_HABITS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    disabled={saving}
                    onClick={() => setForm({ ...EMPTY_FORM, ...p, targetAmount: p.targetAmount || '' })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
                      ${
                        form.title === p.title
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-xs font-medium leading-snug">{p.title}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">Or Custom</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
            </div>
          )}

          {/* Title */}
          <Input
            label="Habit title"
            placeholder="e.g. Save $10 on groceries daily"
            value={form.title}
            onChange={setF('title')}
            error={formError}
            disabled={saving}
          />

          {/* Frequency */}
          <Select label="Cadence" value={form.frequency} onChange={setF('frequency')} disabled={saving}>
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
              placeholder="0.00"
              value={form.targetAmount}
              onChange={setF('targetAmount')}
              disabled={saving}
            />
            <Input
              label="Reminder time (optional)"
              type="time"
              value={form.reminderTime}
              onChange={setF('reminderTime')}
              disabled={saving}
            />
          </div>

          {/* Color + Icon */}
          <div className="flex gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Accent</label>
              <input
                type="color"
                value={form.color}
                onChange={setF('color')}
                disabled={saving}
                className="h-10 w-14 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              />
            </div>
            <Input
              label="Icon (emoji)"
              placeholder="💰"
              value={form.icon}
              onChange={setF('icon')}
              className="flex-1"
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editHabit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
