import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';

/* ─── Constants ─── */
const EXPENSE_CATEGORIES = [
  'Rent','Groceries','Dining Out','Transport','Subscriptions',
  'Entertainment','Healthcare','Shopping','Utilities','Savings Transfer','Other',
];
const INCOME_SOURCES = ['Salary','Freelance','Side hustle','Bonus','Investment return','Gift','Other'];

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const thisMonth = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; };
const toISO = (d) => d?.toISOString?.().slice(0,10) ?? d;

/* ─── Modal backdrop ─── */
function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(22,24,29,0.45)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ─── Record form (income or expense) ─── */
function RecordForm({ type, initial, onSave, onClose }) {
  const isExpense = type === 'expense';
  const [fields, setFields] = useState({
    category: initial?.category || initial?.source || (isExpense ? EXPENSE_CATEGORIES[0] : INCOME_SOURCES[0]),
    amount:   initial?.amount   || '',
    date:     initial?.date     ? toISO(new Date(initial.date)) : new Date().toISOString().slice(0,10),
    note:     initial?.note     || '',
  });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setFields(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    const errs = [];
    if (!fields.amount || Number(fields.amount) <= 0) errs.push('Amount must be positive');
    if (!fields.date)  errs.push('Date is required');
    if (errs.length) { setErrors(errs); return; }
    setBusy(true);
    try {
      const body = isExpense
        ? { category: fields.category, amount: Number(fields.amount), date: fields.date, note: fields.note }
        : { source:   fields.category, amount: Number(fields.amount), date: fields.date, note: fields.note };
      await onSave(body);
      onClose();
    } catch (err) { setErrors(err.errors || ['Save failed']); }
    finally { setBusy(false); }
  }

  const options = isExpense ? EXPENSE_CATEGORIES : INCOME_SOURCES;
  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all";
  const inputStyle = { background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--ink)' };

  return (
    <Card padding="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
          {initial ? 'Edit' : 'Add'} {isExpense ? 'Expense' : 'Income'}
        </h2>
        <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--muted)' }} aria-label="Close">×</button>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <div>
          <p className="text-label mb-1">{isExpense ? 'Category' : 'Source'}</p>
          <select value={fields.category} onChange={e => set('category')(e.target.value)}
                  className={inputCls} style={inputStyle}>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-label mb-1">Amount ($)</p>
            <input type="number" min="0.01" step="0.01" placeholder="0.00"
                   value={fields.amount} onChange={e => set('amount')(e.target.value)}
                   className={inputCls} style={inputStyle} />
          </div>
          <div>
            <p className="text-label mb-1">Date</p>
            <input type="date" value={fields.date} onChange={e => set('date')(e.target.value)}
                   className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div>
          <p className="text-label mb-1">Note (optional)</p>
          <input type="text" placeholder="Add a note…" value={fields.note} onChange={e => set('note')(e.target.value)}
                 className={inputCls} style={inputStyle} />
        </div>

        {errors.length > 0 && (
          <ul className="text-xs rounded-lg p-3" style={{ background: 'rgba(226,87,76,0.08)', color: 'var(--rose)' }}>
            {errors.map((e,i) => <li key={i}>• {e}</li>)}
          </ul>
        )}

        <button type="submit" disabled={busy}
                className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mt-1 transition-all active:scale-[.98]"
                style={{ background: busy ? 'var(--muted)' : 'var(--coral)' }}>
          {busy ? 'Saving…' : 'Save record'}
        </button>
      </form>
    </Card>
  );
}

/* ─── Category pill ─── */
function CatPill({ label, type }) {
  const colors = {
    'Rent': '#6366f1', 'Groceries': '#059669', 'Dining Out': '#f59e0b',
    'Transport': '#3b82f6', 'Subscriptions': '#8b5cf6', 'Entertainment': '#ec4899',
    'Healthcare': '#14b8a6', 'Shopping': '#f97316', 'Utilities': '#64748b',
    'Savings Transfer': '#2FA86C', 'Other': '#9CA3AF',
    'Salary': '#2FA86C', 'Freelance': '#6366f1', 'Side hustle': '#f59e0b',
    'Bonus': '#F2793D', 'Investment return': '#3b82f6', 'Gift': '#ec4899',
  };
  const color = colors[label] || '#9CA3AF';
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

/* ─── Summary stat cards ─── */
function SummaryCards({ income, expenses, prevIncome, prevExpenses }) {
  const net = income - expenses;
  const prevNet = prevIncome - prevExpenses;
  const incomeDelta  = prevIncome  ? ((income   - prevIncome)  / prevIncome  * 100).toFixed(1) : null;
  const expDelta     = prevExpenses? ((expenses - prevExpenses)/ prevExpenses* 100).toFixed(1) : null;
  const netDelta     = prevNet !== 0 ? ((net - prevNet) / Math.abs(prevNet) * 100).toFixed(1) : null;

  const stats = [
    { label: 'Income this month',   value: fmt(income),   delta: incomeDelta,  up: Number(incomeDelta)  >= 0 },
    { label: 'Expenses this month', value: fmt(expenses), delta: expDelta,     up: Number(expDelta)     <  0 },
    { label: 'Net cashflow',        value: fmt(net),      delta: netDelta,     up: Number(net)          >= 0, color: net >= 0 ? 'var(--mint)' : 'var(--rose)' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(s => (
        <Card key={s.label} padding="p-5">
          <Card.Label>{s.label}</Card.Label>
          <p className="text-stat font-bold mt-1 mb-2" style={{ color: s.color || 'var(--ink)' }}>{s.value}</p>
          {s.delta != null && (
            <Card.Delta direction={s.up ? 'up' : 'down'}>{Math.abs(s.delta)}% vs last month</Card.Delta>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ─── Main Tracker Page ─── */
export default function Tracker() {
  const [incomeData,   setIncomeData]   = useState([]);
  const [expenseData,  setExpenseData]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('expense'); // 'income' | 'expense'
  const [modal,        setModal]        = useState(null);      // null | {type, record?}
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('All');
  const [sortKey,      setSortKey]      = useState('date');
  const [sortDir,      setSortDir]      = useState('desc');
  const [deleteConfirm,setDeleteConfirm]= useState(null);

  /* ── Fetch both lists ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [inc, exp] = await Promise.all([
        api.get('/income?limit=200'),
        api.get('/expenses?limit=200'),
      ]);
      setIncomeData(inc.data || []);
      setExpenseData(exp.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Monthly summaries ── */
  const summaryStats = useMemo(() => {
    const now  = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const curM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const preM = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`;

    const monthTotal = (arr, m) =>
      arr.filter(r => r.date?.toString().slice(0,7) === m)
         .reduce((s, r) => s + Number(r.amount), 0);

    return {
      income:       monthTotal(incomeData,  curM),
      expenses:     monthTotal(expenseData, curM),
      prevIncome:   monthTotal(incomeData,  preM),
      prevExpenses: monthTotal(expenseData, preM),
    };
  }, [incomeData, expenseData]);

  /* ── Active dataset ── */
  const activeData = activeTab === 'income' ? incomeData : expenseData;

  /* ── Categories for filter ── */
  const cats = useMemo(() => {
    const s = new Set(activeData.map(r => r.category || r.source));
    return ['All', ...s];
  }, [activeData]);

  /* ── Filtered + sorted rows ── */
  const rows = useMemo(() => {
    let d = [...activeData];
    if (filterCat !== 'All') d = d.filter(r => (r.category || r.source) === filterCat);
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r =>
        (r.category || r.source || '').toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q) ||
        String(r.amount).includes(q)
      );
    }
    d.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'amount') { av = Number(av); bv = Number(bv); }
      else if (sortKey === 'date') { av = new Date(av); bv = new Date(bv); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return d;
  }, [activeData, filterCat, search, sortKey, sortDir]);

  /* ── Sort toggle ── */
  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }
  const SortIcon = ({ k }) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅';

  /* ── CRUD handlers ── */
  async function handleSave(body) {
    const { type, record } = modal;
    if (record) {
      const updated = await api.put(`/${type === 'income' ? 'income' : 'expenses'}/${record.id}`, body);
      type === 'income'
        ? setIncomeData(d => d.map(r => r.id === updated.id ? updated : r))
        : setExpenseData(d => d.map(r => r.id === updated.id ? updated : r));
    } else {
      const created = await api.post(`/${type === 'income' ? 'income' : 'expenses'}`, body);
      type === 'income'
        ? setIncomeData(d => [created, ...d])
        : setExpenseData(d => [created, ...d]);
    }
  }

  async function handleDelete(id) {
    const path = activeTab === 'income' ? 'income' : 'expenses';
    await api.del(`/${path}/${id}`);
    activeTab === 'income'
      ? setIncomeData(d => d.filter(r => r.id !== id))
      : setExpenseData(d => d.filter(r => r.id !== id));
    setDeleteConfirm(null);
  }

  const TH = ({ label, k }) => (
    <th className="text-left py-3 px-4 text-label cursor-pointer select-none whitespace-nowrap"
        onClick={() => toggleSort(k)}>
      {label}<SortIcon k={k} />
    </th>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Log and review every rupee in and out</p>
        </div>
        <button onClick={() => setModal({ type: activeTab })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[.98]"
                style={{ background: 'var(--coral)' }}>
          <span className="text-lg leading-none">+</span>
          Add {activeTab === 'income' ? 'Income' : 'Expense'}
        </button>
      </div>

      {/* ── Summary cards ── */}
      <SummaryCards {...summaryStats} />

      {/* ── Tab + controls ── */}
      <Card padding="p-0" hover={false}>
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {['expense','income'].map(t => (
            <button key={t} onClick={() => { setActiveTab(t); setFilterCat('All'); setSearch(''); }}
                    className="px-6 py-3.5 text-sm font-semibold transition-all relative"
                    style={{ color: activeTab === t ? 'var(--coral)' : 'var(--muted)' }}>
              {t === 'income' ? '↑ Income' : '↓ Expenses'}
              {activeTab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                      style={{ background: 'var(--coral)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search records…"
                 className="flex-1 min-w-[160px] rounded-xl px-3 py-2 text-sm outline-none"
                 style={{ background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--ink)' }} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                  className="rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: 'var(--coral)' }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="font-semibold" style={{ color: 'var(--ink)' }}>
              {search || filterCat !== 'All' ? 'No records match your filter' : `No ${activeTab} records yet`}
            </p>
            <button onClick={() => setModal({ type: activeTab })}
                    className="text-sm font-semibold" style={{ color: 'var(--coral)' }}>
              + Add your first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--canvas)' }}>
                <tr>
                  <TH label="Date"     k="date"     />
                  <TH label="Category" k="category" />
                  <TH label="Amount"   k="amount"   />
                  <th className="text-left py-3 px-4 text-label">Note</th>
                  <th className="py-3 px-4 text-label w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                      className="hover:bg-canvas transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                      {fmtDate(r.date)}
                    </td>
                    <td className="py-3 px-4">
                      <CatPill label={r.category || r.source} type={activeTab} />
                    </td>
                    <td className="py-3 px-4 font-semibold whitespace-nowrap"
                        style={{ color: activeTab === 'income' ? 'var(--mint)' : 'var(--rose)' }}>
                      {activeTab === 'income' ? '+' : '-'}{fmt(r.amount)}
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate" style={{ color: 'var(--muted)' }}>
                      {r.note || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => setModal({ type: activeTab, record: r })}
                                className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                                style={{ color: 'var(--coral)', background: 'rgba(242,121,61,0.1)' }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(r.id)}
                                className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                                style={{ color: 'var(--rose)', background: 'rgba(226,87,76,0.08)' }}>
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 flex justify-between text-label"
                 style={{ borderTop: '1px solid var(--border)' }}>
              <span>{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
              <span>Total: <strong style={{ color: 'var(--ink)' }}>{fmt(rows.reduce((s,r)=>s+Number(r.amount),0))}</strong></span>
            </div>
          </div>
        )}
      </Card>

      {/* ── Add/Edit modal ── */}
      <Modal open={!!modal} onClose={() => setModal(null)}>
        {modal && (
          <RecordForm
            type={modal.type}
            initial={modal.record}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <Card padding="p-6">
          <h2 className="font-bold text-base mb-2" style={{ color: 'var(--ink)' }}>Delete record?</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>This can't be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--canvas)', color: 'var(--muted)', border: '1.5px solid var(--border)' }}>
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'var(--rose)' }}>
              Delete
            </button>
          </div>
        </Card>
      </Modal>
    </main>
  );
}
