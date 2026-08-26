import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import StreakGauge from '@/components/StreakGauge';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
const pct = (cur, target) => target > 0 ? Math.min(Math.round((cur / target) * 100), 100) : 0;
const daysLeft = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  return diff;
};

/* ─── Modal ─── */
function GoalModal({ goal, onSave, onClose }) {
  const [name,   setName]   = useState(goal?.name          || '');
  const [target, setTarget] = useState(goal?.target_amount  || '');
  const [current,setCurrent]= useState(goal?.current_amount || 0);
  const [date,   setDate]   = useState(goal?.target_date?.toString().slice(0,10) || '');
  const [errors, setErrors] = useState([]);
  const [busy,   setBusy]   = useState(false);

  async function submit(e) {
    e.preventDefault();
    const errs = [];
    if (!name.trim())             errs.push('Name is required');
    if (!target || target <= 0)   errs.push('Target amount must be positive');
    if (errs.length) { setErrors(errs); return; }
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        target_amount:  Number(target),
        current_amount: Number(current),
        target_date:    date || null,
      });
      onClose();
    } catch (err) { setErrors(err.errors || ['Save failed']); }
    finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputSt  = { background:'var(--canvas)', border:'1.5px solid var(--border)', color:'var(--ink)' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background:'rgba(22,24,29,0.5)', backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-sm animate-fade-in" onClick={e=>e.stopPropagation()}>
        <Card padding="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color:'var(--ink)' }}>{goal ? 'Edit goal' : 'New savings goal'}</h2>
            <button onClick={onClose} style={{ color:'var(--muted)', fontSize:'1.25rem' }}>×</button>
          </div>
          <form onSubmit={submit} noValidate className="flex flex-col gap-3">
            <div>
              <p className="text-label mb-1">Goal name</p>
              <input autoFocus value={name} onChange={e=>setName(e.target.value)}
                     placeholder="e.g. Emergency Fund" className={inputCls} style={inputSt} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-label mb-1">Target ($)</p>
                <input type="number" min="1" step="1" value={target} onChange={e=>setTarget(e.target.value)}
                       placeholder="10000" className={inputCls} style={inputSt} />
              </div>
              <div>
                <p className="text-label mb-1">Saved so far ($)</p>
                <input type="number" min="0" step="1" value={current} onChange={e=>setCurrent(e.target.value)}
                       placeholder="0" className={inputCls} style={inputSt} />
              </div>
            </div>
            <div>
              <p className="text-label mb-1">Target date (optional)</p>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                     className={inputCls} style={inputSt} />
            </div>
            {errors.length > 0 && (
              <ul className="text-xs rounded-lg p-3" style={{ background:'rgba(226,87,76,0.08)', color:'var(--rose)' }}>
                {errors.map((e,i)=><li key={i}>• {e}</li>)}
              </ul>
            )}
            <button type="submit" disabled={busy}
                    className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mt-1"
                    style={{ background: busy ? 'var(--muted)' : 'var(--coral)' }}>
              {busy ? 'Saving…' : 'Save goal'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

/* ─── Deposit modal ─── */
function DepositModal({ goal, onDeposit, onClose }) {
  const [amount, setAmount] = useState('');
  const [busy,   setBusy]   = useState(false);
  const remaining = Math.max(0, (goal.target_amount || 0) - (goal.current_amount || 0));

  async function submit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setBusy(true);
    try { await onDeposit(goal.id, Number(amount)); onClose(); }
    catch { /* handled upstream */ }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background:'rgba(22,24,29,0.5)', backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-xs animate-fade-in" onClick={e=>e.stopPropagation()}>
        <Card padding="p-6">
          <h2 className="font-bold mb-1" style={{ color:'var(--ink)' }}>Add to "{goal.name}"</h2>
          <p className="text-sm mb-4" style={{ color:'var(--muted)' }}>
            {fmt(remaining)} remaining to reach your goal
          </p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input autoFocus type="number" min="1" step="1" placeholder="Amount ($)"
                   value={amount} onChange={e=>setAmount(e.target.value)}
                   className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                   style={{ background:'var(--canvas)', border:'1.5px solid var(--border)', color:'var(--ink)' }} />
            {remaining > 0 && (
              <div className="flex gap-2">
                {[50, 100, 250, remaining].filter((v,i,a) => a.indexOf(v)===i && v <= remaining).map(v => (
                  <button key={v} type="button" onClick={() => setAmount(v)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background:'var(--canvas)', border:'1.5px solid var(--border)', color:'var(--muted)' }}>
                    {v === remaining ? 'All' : `$${v}`}
                  </button>
                ))}
              </div>
            )}
            <button type="submit" disabled={busy || !amount}
                    className="w-full py-2.5 rounded-xl font-semibold text-white text-sm"
                    style={{ background: busy ? 'var(--muted)' : 'var(--mint)' }}>
              {busy ? 'Adding…' : `Deposit ${amount ? fmt(amount) : ''}`}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

/* ─── Goal card ─── */
function GoalCard({ goal, onEdit, onDelete, onOpenDeposit }) {
  const p = pct(goal.current_amount, goal.target_amount);
  const dl = daysLeft(goal.target_date);
  const completed = p >= 100;

  return (
    <Card padding="p-5" className="flex flex-col gap-4">
      <div className="flex items-start gap-5">
        {/* Reuse StreakGauge for progress ring — streak=pct, max=100 */}
        <StreakGauge streak={p} max={100} label={`${p}%`} size={88} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base leading-tight" style={{ color:'var(--ink)' }}>{goal.name}</h3>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(goal)}
                      className="text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ color:'var(--coral)', background:'rgba(242,121,61,0.1)' }}>Edit</button>
              <button onClick={() => onDelete(goal.id)}
                      className="text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ color:'var(--rose)', background:'rgba(226,87,76,0.08)' }}>Del</button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background:'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width:`${p}%`, background: completed ? 'var(--mint)' : 'var(--coral)' }} />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
            <div>
              <p className="text-label">Saved</p>
              <p className="font-bold text-sm" style={{ color:'var(--mint)' }}>{fmt(goal.current_amount)}</p>
            </div>
            <div>
              <p className="text-label">Target</p>
              <p className="font-bold text-sm" style={{ color:'var(--ink)' }}>{fmt(goal.target_amount)}</p>
            </div>
            <div>
              <p className="text-label">Remaining</p>
              <p className="font-bold text-sm" style={{ color:'var(--muted)' }}>
                {fmt(Math.max(0, goal.target_amount - goal.current_amount))}
              </p>
            </div>
            {dl !== null && (
              <div>
                <p className="text-label">Deadline</p>
                <p className="font-bold text-sm" style={{ color: dl < 0 ? 'var(--rose)' : dl < 30 ? 'var(--coral)' : 'var(--muted)' }}>
                  {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Today!' : `${dl}d left`}
                </p>
              </div>
            )}
          </div>

          {/* Deposit CTA */}
          {!completed ? (
            <button onClick={() => onOpenDeposit(goal)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-[.97]"
                    style={{ background:'var(--coral)' }}>
              <span className="text-base leading-none">+</span> Add contribution
            </button>
          ) : (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                 style={{ background:'rgba(47,168,108,0.1)', color:'var(--mint)' }}>
              🎉 Goal reached!
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─── Goals page ─── */
export default function Goals() {
  const [goals,    setGoals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);  // null | { goal? }
  const [deposit,  setDeposit]  = useState(null);  // goal object
  const [delId,    setDelId]    = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try { setGoals(await api.get('/goals')); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  /* ── CRUD ── */
  async function handleSave(body) {
    if (modal?.goal) {
      const updated = await api.put(`/goals/${modal.goal.id}`, body);
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    } else {
      const created = await api.post('/goals', body);
      setGoals(prev => [...prev, created]);
    }
  }

  async function handleDeposit(id, amount) {
    const updated = await api.patch(`/goals/${id}/deposit`, { amount });
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
  }

  async function handleDelete(id) {
    await api.del(`/goals/${id}`);
    setGoals(prev => prev.filter(g => g.id !== id));
    setDelId(null);
  }

  /* ── Summary stats ── */
  const totalTarget  = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved   = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const overallPct   = pct(totalSaved, totalTarget);
  const completedCnt = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--ink)' }}>Savings Goals</h1>
          <p className="text-sm mt-0.5" style={{ color:'var(--muted)' }}>
            {goals.length > 0
              ? `${completedCnt} of ${goals.length} goal${goals.length!==1?'s':''} reached`
              : 'Set a target and start saving toward it'}
          </p>
        </div>
        <button onClick={() => setModal({})}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white active:scale-[.98]"
                style={{ background:'var(--coral)' }}>
          <span className="text-lg leading-none">+</span> New goal
        </button>
      </div>

      {/* Summary cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="p-5" className="flex items-center gap-4">
            <StreakGauge streak={overallPct} max={100} label={`${overallPct}%`} size={64} />
            <div>
              <Card.Label>Overall progress</Card.Label>
              <p className="text-stat font-bold" style={{ color:'var(--ink)' }}>{fmt(totalSaved)}</p>
              <p className="text-xs mt-0.5" style={{ color:'var(--muted)' }}>of {fmt(totalTarget)}</p>
            </div>
          </Card>
          <Card padding="p-5">
            <Card.Label>Goals completed</Card.Label>
            <p className="text-stat font-bold mt-1" style={{ color:'var(--mint)' }}>{completedCnt}</p>
            <Card.Delta direction={completedCnt > 0 ? 'up' : 'neutral'}>{goals.length} total</Card.Delta>
          </Card>
          <Card padding="p-5">
            <Card.Label>Still to save</Card.Label>
            <p className="text-stat font-bold mt-1" style={{ color:'var(--coral)' }}>{fmt(totalTarget - totalSaved)}</p>
            <Card.Delta direction="neutral">across {goals.length - completedCnt} active</Card.Delta>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <span className="w-10 h-10 rounded-full border-4 animate-spin"
                style={{ borderColor:'var(--border)', borderTopColor:'var(--coral)' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && goals.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">🎯</span>
          <p className="font-bold text-lg" style={{ color:'var(--ink)' }}>No savings goals yet</p>
          <p className="text-sm" style={{ color:'var(--muted)', maxWidth:320 }}>
            Start with something small — even a $500 goal builds the habit of saving consistently.
          </p>
          <button onClick={() => setModal({})}
                  className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background:'var(--coral)' }}>
            Set your first goal
          </button>
        </Card>
      )}

      {/* Goal cards */}
      {!loading && goals.map(goal => (
        <GoalCard key={goal.id} goal={goal}
                  onEdit={g => setModal({ goal: g })}
                  onDelete={id => setDelId(id)}
                  onOpenDeposit={g => setDeposit(g)} />
      ))}

      {/* Modals */}
      {modal !== null && <GoalModal goal={modal.goal} onSave={handleSave} onClose={() => setModal(null)} />}
      {deposit && <DepositModal goal={deposit} onDeposit={handleDeposit} onClose={() => setDeposit(null)} />}

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background:'rgba(22,24,29,0.5)', backdropFilter:'blur(4px)' }} onClick={()=>setDelId(null)}>
          <div className="w-full max-w-sm animate-fade-in" onClick={e=>e.stopPropagation()}>
            <Card padding="p-6">
              <h2 className="font-bold mb-2" style={{ color:'var(--ink)' }}>Delete this goal?</h2>
              <p className="text-sm mb-5" style={{ color:'var(--muted)' }}>All saved progress will be lost.</p>
              <div className="flex gap-3">
                <button onClick={()=>setDelId(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background:'var(--canvas)', border:'1.5px solid var(--border)', color:'var(--muted)' }}>Cancel</button>
                <button onClick={()=>handleDelete(delId)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background:'var(--rose)' }}>Delete</button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
