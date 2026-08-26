import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import StreakGauge from '@/components/StreakGauge';
import HabitHeatmap from '@/components/HabitHeatmap';

const FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const today = () => new Date().toISOString().slice(0, 10);

/* ─── Add/Edit modal ─── */
function HabitModal({ habit, onSave, onClose }) {
  const [name,      setName]      = useState(habit?.name      || '');
  const [frequency, setFrequency] = useState(habit?.frequency || 'daily');
  const [error,     setError]     = useState('');
  const [busy,      setBusy]      = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    try { await onSave({ name: name.trim(), frequency }); onClose(); }
    catch (err) { setError(err.errors?.[0] || 'Save failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(22,24,29,0.5)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
        <Card padding="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: 'var(--ink)' }}>
              {habit ? 'Edit habit' : 'New habit'}
            </h2>
            <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.25rem' }}>×</button>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <div>
              <p className="text-label mb-1">Habit name</p>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Review finances for 10 min"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background:'var(--canvas)', border:'1.5px solid var(--border)', color:'var(--ink)' }}
              />
            </div>
            <div>
              <p className="text-label mb-1">Frequency</p>
              <div className="flex gap-2">
                {['daily','weekly','monthly'].map(f => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: frequency === f ? 'var(--coral)' : 'var(--canvas)',
                            color:      frequency === f ? '#fff'         : 'var(--muted)',
                            border:     frequency === f ? 'none' : '1.5px solid var(--border)',
                          }}>
                    {FREQ_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs" style={{ color: 'var(--rose)' }}>• {error}</p>}
            <button type="submit" disabled={busy}
                    className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mt-1"
                    style={{ background: busy ? 'var(--muted)' : 'var(--coral)' }}>
              {busy ? 'Saving…' : 'Save habit'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

/* ─── Single habit card ─── */
function HabitCard({ habit, logs, onCheckin, onEdit, onDelete }) {
  const todayStr = today();
  const todayLog = logs.find(l => l.date?.toString().slice(0,10) === todayStr);
  const doneToday = todayLog?.completed === true;
  const [checking, setChecking] = useState(false);

  async function handleCheckin() {
    setChecking(true);
    try { await onCheckin(habit.id); }
    finally { setChecking(false); }
  }

  const maxStreak = Math.max(habit.longest_streak || 30, 30);

  return (
    <Card padding="p-5" className="flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start gap-4">
        {/* Gauge */}
        <StreakGauge streak={habit.current_streak} max={maxStreak} label="Streak" size={76} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--ink)' }}>
              {habit.name}
            </h3>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(habit)}
                      className="text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ color: 'var(--coral)', background: 'rgba(242,121,61,0.1)' }}>
                Edit
              </button>
              <button onClick={() => onDelete(habit.id)}
                      className="text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ color: 'var(--rose)', background: 'rgba(226,87,76,0.08)' }}>
                Del
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-label"
                  style={{ background:'var(--canvas)', borderRadius:6, padding:'2px 8px',
                           color:'var(--muted)', textTransform:'none', fontSize:'0.7rem', fontWeight:500 }}>
              {FREQ_LABEL[habit.frequency]}
            </span>
            {habit.longest_streak > 0 && (
              <span className="text-label" style={{ fontSize:'0.68rem', color:'var(--muted)' }}>
                Best: {habit.longest_streak} days
              </span>
            )}
          </div>

          {/* Check-off button */}
          <button
            onClick={handleCheckin}
            disabled={checking}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[.97]"
            style={{
              background: doneToday ? 'rgba(47,168,108,0.12)' : 'var(--coral)',
              color:      doneToday ? 'var(--mint)'            : '#fff',
              border:     doneToday ? '1.5px solid var(--mint)': 'none',
            }}
          >
            {checking ? (
              <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
            ) : doneToday ? (
              <span>✓</span>
            ) : (
              <span>○</span>
            )}
            {doneToday ? 'Done today — undo?' : 'Mark done today'}
          </button>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <p className="text-label mb-2">Last 12 weeks</p>
        <HabitHeatmap logs={logs} weeks={12} />
      </div>
    </Card>
  );
}

/* ─── Overall streak health gauge ─── */
function OverallHealth({ habits, logsMap }) {
  if (!habits.length) return null;
  const t = today();
  const avgStreak = habits.reduce((s, h) => s + (h.current_streak || 0), 0) / habits.length;
  const doneToday = habits.filter(h =>
    (logsMap[h.id] || []).some(l => l.date?.toString().slice(0,10) === t && l.completed)
  ).length;

  return (
    <Card padding="p-5" className="flex items-center gap-5">
      <StreakGauge streak={Math.round(avgStreak)} max={30} label="Avg Streak" size={96} />
      <div className="flex-1">
        <Card.Label>Overall Streak Health</Card.Label>
        <p className="text-stat font-bold mt-1" style={{ color: 'var(--ink)' }}>
          {doneToday}/{habits.length} done today
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Avg streak: <strong style={{ color: 'var(--coral)' }}>{Math.round(avgStreak)} days</strong>
        </p>
      </div>
    </Card>
  );
}


/* ─── Habits Page ─── */
export default function Habits() {
  const [habits,   setHabits]   = useState([]);
  const [logsMap,  setLogsMap]  = useState({});   // { habitId: [...logs] }
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);  // null | { habit? }
  const [delId,    setDelId]    = useState(null);

  /* ── Fetch habits + their logs ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get('/habits');
      setHabits(list);
      // Fetch logs for each habit in parallel
      const logResults = await Promise.all(
        list.map(h => api.get(`/habits/${h.id}/logs?days=84`)) // 12 weeks
      );
      const map = {};
      list.forEach((h, i) => { map[h.id] = logResults[i]; });
      setLogsMap(map);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Check-in handler — optimistic update ── */
  async function handleCheckin(habitId) {
    const t = today();
    const result = await api.post(`/habits/${habitId}/checkin`, {});

    // Update habit streak counts
    setHabits(prev => prev.map(h =>
      h.id === habitId
        ? { ...h, current_streak: result.current_streak, longest_streak: result.longest_streak }
        : h
    ));

    // Toggle today's log in logsMap
    setLogsMap(prev => {
      const existing = prev[habitId] || [];
      const todayLog = existing.find(l => l.date?.toString().slice(0,10) === t);
      let updated;
      if (todayLog) {
        updated = existing.map(l =>
          l.date?.toString().slice(0,10) === t
            ? { ...l, completed: result.log.completed }
            : l
        );
      } else {
        updated = [{ habit_id: habitId, date: t, completed: true }, ...existing];
      }
      return { ...prev, [habitId]: updated };
    });
  }

  /* ── Save habit (add/edit) ── */
  async function handleSave(body) {
    if (modal?.habit) {
      const updated = await api.put(`/habits/${modal.habit.id}`, body);
      setHabits(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h));
    } else {
      const created = await api.post('/habits', body);
      setHabits(prev => [...prev, created]);
      setLogsMap(prev => ({ ...prev, [created.id]: [] }));
    }
  }

  /* ── Delete ── */
  async function handleDelete(id) {
    await api.del(`/habits/${id}`);
    setHabits(prev => prev.filter(h => h.id !== id));
    setLogsMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDelId(null);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Habit Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {habits.length > 0
              ? `You've completed ${habits.filter(h => (logsMap[h.id]||[]).find(l=>l.date?.toString().slice(0,10)===today()&&l.completed)).length} of ${habits.length} habits today`
              : 'Start a habit and build your streak'}
          </p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[.98]"
          style={{ background: 'var(--coral)' }}>
          <span className="text-lg leading-none">+</span> New habit
        </button>
      </div>

      {/* Overall health */}
      {habits.length > 0 && <OverallHealth habits={habits} logsMap={logsMap} />}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <span className="w-10 h-10 rounded-full border-4 animate-spin"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--coral)' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && habits.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">🔥</span>
          <p className="font-bold text-lg" style={{ color: 'var(--ink)' }}>No habits yet</p>
          <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: 300 }}>
            Pick one small habit and stick with it — your first streak starts today.
          </p>
          <button onClick={() => setModal({})}
                  className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: 'var(--coral)' }}>
            Create your first habit
          </button>
        </Card>
      )}

      {/* Habit cards */}
      {!loading && habits.map(habit => (
        <HabitCard
          key={habit.id}
          habit={habit}
          logs={logsMap[habit.id] || []}
          onCheckin={handleCheckin}
          onEdit={(h) => setModal({ habit: h })}
          onDelete={(id) => setDelId(id)}
        />
      ))}

      {/* Add/Edit modal */}
      {modal !== null && (
        <HabitModal
          habit={modal.habit}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(22,24,29,0.5)', backdropFilter: 'blur(4px)' }}
             onClick={() => setDelId(null)}>
          <div className="w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
            <Card padding="p-6">
              <h2 className="font-bold mb-2" style={{ color: 'var(--ink)' }}>Delete this habit?</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
                Your streak and all log history will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--muted)' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(delId)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'var(--rose)' }}>
                  Delete
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
