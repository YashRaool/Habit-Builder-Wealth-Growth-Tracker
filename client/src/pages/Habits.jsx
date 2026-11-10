import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Flame, Trash2, Pencil, CheckCheck, Circle, TrendingUp, Sparkles, Loader2,
} from 'lucide-react';
import { habitsAPI } from '../api/habits';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

/* ─── Presets ─────────────────────────────────────────────────── */
const PRESET_HABITS = [
  { title: 'Save $5/day', icon: '💰', color: '#4f46e5', frequency: 'daily', targetAmount: 5 },
  { title: 'Check Bank App', icon: '📱', color: '#6366f1', frequency: 'daily' },
  { title: 'No Takeout Day', icon: '🥗', color: '#f59e0b', frequency: 'daily' },
  { title: 'Read 10 mins Finance', icon: '📚', color: '#3b82f6', frequency: 'daily' },
  { title: 'Review budget', icon: '📊', color: '#10b981', frequency: 'weekly' },
  { title: 'Invest weekly', icon: '📈', color: '#8b5cf6', frequency: 'weekly', targetAmount: 50 },
];

const EMPTY_FORM = {
  title: '', frequency: 'daily', targetAmount: '', reminderTime: '', color: '#4f46e5', icon: '💰',
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function buildLast12Weeks(logs) {
  const days = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const log = logs?.find((l) => isSameDay(l.date, d));
    days.push({
      date: d,
      completed: log?.completed || false,
      isToday: i === 0,
    });
  }

  // 12 columns of 7 days
  const weeks = [];
  for (let i = 0; i < 12; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }
  const completionsCount = days.filter((d) => d.completed).length;

  return { weeks, completionsCount };
}

/* ─── Habit Bento Card ────────────────────────────────────────── */
function HabitCard({ habit, onCheckIn, checkingIn, onEdit, onDelete }) {
  const checkedToday = habit.logs?.some((l) => isSameDay(l.date, new Date()) && l.completed);
  const isChecking = checkingIn === habit._id;
  const { weeks, completionsCount } = useMemo(() => buildLast12Weeks(habit.logs), [habit.logs]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-5 transition-all duration-150 hover:border-slate-300">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular streak badge */}
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200/90 flex flex-col items-center justify-center shrink-0 text-amber-700 shadow-xs">
            <Flame size={14} className="text-amber-600 fill-amber-500 -mb-0.5" />
            <span className="text-[11px] font-bold leading-tight">{habit.currentStreak || 0}d</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate leading-snug">{habit.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 text-xs font-medium capitalize">
                {habit.frequency || 'Daily'}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                BEST: {habit.longestStreak || 0} DAYS
              </span>
            </div>
          </div>
        </div>

        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(habit)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Edit habit"
            aria-label="Edit habit"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(habit._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete habit"
            aria-label="Delete habit"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Middle Action Button */}
      <div>
        {checkedToday ? (
          <button
            type="button"
            onClick={() => onCheckIn(habit)}
            disabled={isChecking}
            className="w-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isChecking ? (
              <Loader2 size={14} className="animate-spin text-emerald-600" />
            ) : (
              <CheckCheck size={14} className="text-emerald-600" />
            )}
            <span>✓ Done today — undo?</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCheckIn(habit)}
            disabled={isChecking}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isChecking ? (
              <Loader2 size={14} className="animate-spin text-white" />
            ) : (
              <Circle size={14} />
            )}
            <span>Mark done today</span>
          </button>
        )}
      </div>

      {/* Bottom Heatmap Container (LAST 12 WEEKS) */}
      <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          LAST 12 WEEKS
        </div>
        <div className="flex justify-between items-center gap-1 overflow-x-auto py-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1 flex-1 items-center">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  title={`${day.date.toLocaleDateString()}: ${day.completed ? 'Completed' : 'Missed'}`}
                  className={`w-full aspect-square max-w-[14px] rounded-[3px] transition-colors ${
                    day.completed ? 'bg-emerald-500' : 'bg-slate-200'
                  } ${day.isToday ? 'ring-1 ring-slate-400 ring-offset-1' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-200/60 text-xs">
          <span className="text-slate-500 font-medium">
            {completionsCount} {completionsCount === 1 ? 'completion' : 'completions'} in last 12 weeks
          </span>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-200 inline-block" /> Miss
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 inline-block" /> Done
            </span>
          </div>
        </div>
      </div>
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [editHabit, setEditHabit] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await habitsAPI.getAll();
      setHabits(res.data.data.habits || []);
    } catch {
      toast.error('Failed to load habits.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  /* ── Check-in (toggle) ── */
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
    setForm({
      title: h.title,
      frequency: h.frequency || 'daily',
      targetAmount: h.targetAmount || '',
      reminderTime: h.reminderTime || '',
      color: h.color || '#4f46e5',
      icon: h.icon || '💰',
    });
    setFormError('');
    setModalOpen(true);
  };

  /* ── Save ── */
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

  /* ── Delete ── */
  const promptDelete = (id) => {
    setHabitToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!habitToDelete) return;
    try {
      await habitsAPI.delete(habitToDelete);
      toast.success('Habit deleted.');
      setHabits((prev) => prev.filter((h) => h._id !== habitToDelete));
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleteModalOpen(false);
      setHabitToDelete(null);
    }
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const activeHabits = habits.filter((h) => h.isActive !== false);
  const totalActive = activeHabits.length;
  const todayStr = new Date().toDateString();
  const completedTodayCount = activeHabits.filter((h) =>
    h.logs?.some((l) => new Date(l.date).toDateString() === todayStr && l.completed)
  ).length;

  const totalStreak = activeHabits.reduce((s, h) => s + (h.currentStreak || 0), 0);
  const avgStreak = totalActive > 0 ? (totalStreak / totalActive).toFixed(1) : '0';
  const longestEver = habits.length > 0 ? Math.max(...habits.map((h) => h.longestStreak || 0), 0) : 0;
  const pct = totalActive > 0 ? Math.round((completedTodayCount / totalActive) * 100) : 0;

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-44 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-4 w-60 bg-slate-200/70 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200/70 rounded-xl animate-pulse" />
        </div>

        {/* 3 KPI Command Row Skeleton */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs h-36 animate-pulse flex flex-col justify-between">
              <div className="h-4 w-28 bg-slate-200/70 rounded" />
              <div className="h-8 w-40 bg-slate-200/70 rounded-lg" />
              <div className="h-2 w-full bg-slate-200/70 rounded-full" />
            </div>
          ))}
        </div>

        {/* 2-Column Bento Grid Skeletons */}
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs h-72 animate-pulse flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200/70" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 bg-slate-200/70 rounded" />
                  <div className="h-3 w-24 bg-slate-200/70 rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-slate-200/70 rounded-xl" />
              <div className="h-28 w-full bg-slate-100 rounded-xl" />
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Habit Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalActive > 0
              ? `You've completed ${completedTodayCount} of ${totalActive} habits today`
              : 'Start your streak by creating your first financial habit'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-4 py-2 text-sm shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={16} /> New habit
        </button>
      </div>

      {/* ── 2. Full-Width 3-Card Command Row ── */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Card 1: OVERALL STREAK HEALTH */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                OVERALL STREAK HEALTH
              </span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {completedTodayCount} of {totalActive} done today
              </p>
            </div>
            {/* Circular Progress Ring */}
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
                  className="text-emerald-500 stroke-current transition-all duration-700"
                  strokeWidth="4"
                  strokeDasharray={113.1}
                  strokeDashoffset={113.1 - (pct / 100) * 113.1}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-800">{pct}%</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: AVERAGE & BEST STREAK */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              AVERAGE & BEST STREAK
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                Avg streak: {avgStreak} <span className="text-sm font-medium text-slate-500">days</span>
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <Flame size={13} className="text-amber-600 fill-amber-500" /> {longestEver}d best
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            {totalStreak} total accumulated streak days across your habits.
          </p>
        </div>

        {/* Card 3: HABIT CONSISTENCY */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              HABIT CONSISTENCY
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {totalActive} <span className="text-sm font-medium text-slate-500">Active</span>
              </p>
              {completedTodayCount === totalActive && totalActive > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <CheckCheck size={13} /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  <Circle size={9} className="fill-indigo-600" /> {totalActive - completedTodayCount} Pending
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            {completedTodayCount > 0
              ? `${completedTodayCount} of ${totalActive} routines checked off today`
              : 'No routines checked in yet today'}
          </p>
        </div>
      </div>

      {/* ── 3. 2-Column Bento Grid of Habit Cards ── */}
      {activeHabits.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Flame size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">No habits tracked yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Build consistent financial habits. Start with a recommended preset below or create your own custom routine.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreate()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-4 py-2 text-sm shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={15} /> Create Habit
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {activeHabits.map((h) => (
            <HabitCard
              key={h._id}
              habit={h}
              onCheckIn={handleCheckIn}
              checkingIn={checkingIn}
              onEdit={openEdit}
              onDelete={promptDelete}
            />
          ))}
        </div>
      )}

      {/* ── Recommended Starter Habits ── */}
      <div className="pt-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={13} className="text-indigo-600" /> Recommended Starter Habits
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESET_HABITS.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => openCreate(p)}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-150 cursor-pointer group shadow-xs"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-150">{p.icon}</div>
              <p className="text-xs text-slate-700 leading-snug font-medium group-hover:text-indigo-700">{p.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Create / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editHabit ? 'Edit habit' : 'New habit'}
      >
        <div className="space-y-4">
          {/* Preset picker (only in create mode) */}
          {!editHabit && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Start from a preset</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_HABITS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => setForm({ ...EMPTY_FORM, ...p, targetAmount: p.targetAmount || '' })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all duration-150 cursor-pointer ${
                      form.title === p.title
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
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
                <span className="text-[11px] text-slate-400">or enter details manually</span>
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
            {formError && <p className="text-xs text-rose-500">{formError}</p>}
          </div>

          {/* Frequency Segmented Pills */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">Frequency</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              {['daily', 'weekly', 'monthly'].map((freq) => {
                const isActive = form.frequency === freq;
                return (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setForm({ ...form, frequency: freq })}
                    className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {freq}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Amount & Reminder */}
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
              <label className="text-xs font-medium text-slate-700">Accent Color</label>
              <input
                type="color"
                value={form.color}
                onChange={setF('color')}
                className="h-10 w-14 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white"
              />
            </div>
            <Input
              label="Icon (emoji)"
              placeholder="💰"
              value={form.icon}
              onChange={setF('icon')}
              className="flex-1"
            />
          </div>

          {/* Preview */}
          {form.title && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ backgroundColor: `${form.color}10`, borderColor: `${form.color}30` }}
            >
              <span className="text-xl">{form.icon}</span>
              <span className="text-sm font-medium text-slate-800">{form.title}</span>
              <span className="ml-auto text-xs text-slate-400 capitalize">{form.frequency}</span>
            </div>
          )}

          {/* Actions */}
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
              ) : (
                'Save habit'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setHabitToDelete(null);
        }}
        title="Delete this habit?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this habit? All check-in history and streak progress will be permanently removed.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setHabitToDelete(null);
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
              Delete habit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
