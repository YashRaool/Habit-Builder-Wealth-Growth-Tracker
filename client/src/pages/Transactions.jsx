import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Search, Trash2, Pencil, TrendingUp, TrendingDown, DollarSign,
  ChevronLeft, ChevronRight, X, RotateCcw, RefreshCw, MoreVertical,
  ShoppingCart, Home, Car, Heart, Tv, Briefcase, GraduationCap, Zap,
  Shield, Plane, Smile, Wallet, Gift, BarChart2, Star, Calendar,
  ArrowUpCircle, ArrowDownCircle, Filter,
} from 'lucide-react';
import { transactionsAPI } from '../api/transactions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

/* ─── Constants ────────────────────────────────────────────────── */

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Gift', 'Other Income'],
  expense: ['Food & Dining', 'Housing', 'Transportation', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Utilities', 'Insurance', 'Travel', 'Personal Care', 'Other Expense'],
};

const CATEGORY_ICONS = {
  'Salary': Briefcase, 'Freelance': Star, 'Investment': BarChart2, 'Bonus': Gift,
  'Gift': Gift, 'Other Income': Wallet,
  'Food & Dining': ShoppingCart, 'Housing': Home, 'Transportation': Car,
  'Healthcare': Heart, 'Entertainment': Tv, 'Shopping': ShoppingCart,
  'Education': GraduationCap, 'Utilities': Zap, 'Insurance': Shield,
  'Travel': Plane, 'Personal Care': Smile, 'Other Expense': Wallet,
};

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const EMPTY_FORM = {
  type: 'expense', category: '', amount: '',
  date: new Date().toISOString().slice(0, 10), description: '', isRecurring: false,
};

const DEFAULT_FILTERS = { type: '', category: '', search: '', startDate: '', endDate: '', page: 1, limit: 15, sort: '-date' };

/* ─── KPI Card ──────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, accent }) {
  const accents = {
    emerald: {
      icon: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      value: 'text-emerald-600',
      bar: 'from-emerald-400 to-emerald-600',
    },
    red: {
      icon: 'text-red-500 bg-red-50 border-red-100',
      value: 'text-red-500',
      bar: 'from-red-400 to-red-600',
    },
    blue: {
      icon: 'text-blue-600 bg-blue-50 border-blue-100',
      value: 'text-blue-600',
      bar: 'from-blue-400 to-blue-600',
    },
  };
  const a = accents[accent] || accents.blue;

  return (
    <div className="card flex flex-col gap-3 relative overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`w-9 h-9 flex items-center justify-center rounded-xl border ${a.icon}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${a.value}`}>{value}</p>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-40 ${a.bar}`} />
    </div>
  );
}

/* ─── Category Icon Chip ────────────────────────────────────────── */
function CategoryChip({ category, type }) {
  const Icon = CATEGORY_ICONS[category] || Wallet;
  const isIncome = type === 'income';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
      <Icon size={15} />
    </span>
  );
}

/* ─── Row Action Menu ───────────────────────────────────────────── */
function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Row actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-fade-in">
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function Transactions() {
  const { user } = useAuth();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  /* ── Data fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [txRes, sumRes] = await Promise.all([
        transactionsAPI.getAll(params),
        transactionsAPI.getSummary({ months: 1 }),
      ]);
      setTransactions(txRes.data.data);
      setPagination(txRes.data.pagination);
      setSummary(sumRes.data.data.summary);
    } catch {
      toast.error('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Modal helpers ── */
  const openCreate = () => { setEditTx(null); setForm(EMPTY_FORM); setFormErrors({}); setModalOpen(true); };
  const openEdit = (tx) => {
    setEditTx(tx);
    setForm({ type: tx.type, category: tx.category, amount: tx.amount, date: tx.date?.slice(0, 10), description: tx.description || '', isRecurring: tx.isRecurring || false });
    setFormErrors({});
    setModalOpen(true);
  };

  /* ── Validation (unchanged rules) ── */
  const validate = () => {
    const e = {};
    if (!form.type) e.type = 'Required';
    if (!form.category) e.category = 'Required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Must be positive';
    if (!form.date) e.date = 'Required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTx) {
        await transactionsAPI.update(editTx._id, form);
        toast.success('Transaction updated.');
      } else {
        await transactionsAPI.create(form);
        toast.success('Transaction added.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionsAPI.delete(id);
      toast.success('Transaction deleted.');
      fetchData();
    } catch {
      toast.error('Delete failed.');
    }
  };

  /* ── Helpers ── */
  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const setFilter = (f) => (e) => setFilters({ ...filters, [f]: e.target.value, page: 1 });
  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const hasActiveFilters = filters.type || filters.category || filters.search || filters.startDate || filters.endDate;

  const cur = summary[summary.length - 1] || { income: 0, expense: 0 };
  const net = cur.income - cur.expense;

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track, review and manage all your income and expenses.</p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto shrink-0">
          <Plus size={16} /> Add Transaction
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={ArrowUpCircle} label="Total Income" value={fmt(cur.income, user?.currency)} accent="emerald" />
        <KpiCard icon={ArrowDownCircle} label="Total Expenses" value={fmt(cur.expense, user?.currency)} accent="red" />
        <KpiCard
          icon={DollarSign}
          label="Net Cash Flow"
          value={fmt(net, user?.currency)}
          accent={net >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="card py-4 px-4 sm:px-5">
        {/* Top row: search + toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search transactions…"
              className="input-field pl-9 py-2 text-sm"
              value={filters.search}
              onChange={setFilter('search')}
            />
            {filters.search && (
              <button 
                onClick={() => setFilters({ ...filters, search: '', page: 1 })} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg p-0.5"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center justify-center flex-1 sm:flex-none gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 shrink-0
                ${showFilters || hasActiveFilters
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <span className="ml-0.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {[filters.type, filters.category, filters.startDate, filters.endDate].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors shrink-0">
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Expandable filter row */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Type</label>
              <select className="input-field py-2 text-sm appearance-none" value={filters.type} onChange={setFilter('type')}>
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Category</label>
              <select className="input-field py-2 text-sm appearance-none" value={filters.category} onChange={setFilter('category')}>
                <option value="">All Categories</option>
                {[...CATEGORIES.income, ...CATEGORIES.expense].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">From</label>
              <input type="date" className="input-field py-2 text-sm" value={filters.startDate} onChange={setFilter('startDate')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">To</label>
              <input type="date" className="input-field py-2 text-sm" value={filters.endDate} onChange={setFilter('endDate')} />
            </div>
          </div>
        )}

        {/* Sort row */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium shrink-0">Sort:</span>
          {[
            { label: 'Newest', value: '-date' },
            { label: 'Oldest', value: 'date' },
            { label: 'Highest', value: '-amount' },
            { label: 'Lowest', value: 'amount' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilters({ ...filters, sort: value, page: 1 })}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150
                ${filters.sort === value
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction Table / Cards ── */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-400">Loading transactions…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <DollarSign size={26} className="text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">No transactions yet</p>
              <p className="text-sm text-slate-400 mt-0.5">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'Add your first transaction to get started.'}
              </p>
            </div>
            {!hasActiveFilters ? (
              <Button onClick={openCreate} size="sm"><Plus size={14} /> Add Transaction</Button>
            ) : (
              <button onClick={resetFilters} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                <RotateCcw size={13} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr
                      key={tx._id}
                      className="group hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      {/* Transaction col */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <CategoryChip category={tx.category} type={tx.type} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
                              {tx.description || tx.category}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              {tx.category}
                              {tx.isRecurring && (
                                <span className="inline-flex items-center gap-0.5 ml-1 text-blue-500 font-medium">
                                  <RefreshCw size={10} /> recurring
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date col */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar size={13} className="text-slate-300" />
                          {fmtDate(tx.date)}
                        </span>
                      </td>

                      {/* Type badge col */}
                      <td className="px-5 py-3.5">
                        <span className={tx.type === 'income' ? 'badge-income' : 'badge-expense'}>
                          {tx.type === 'income' ? (
                            <TrendingUp size={11} />
                          ) : (
                            <TrendingDown size={11} />
                          )}
                          {tx.type}
                        </span>
                      </td>

                      {/* Amount col */}
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount, user?.currency)}
                        </span>
                      </td>

                      {/* Actions col */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionMenu onEdit={() => openEdit(tx)} onDelete={() => handleDelete(tx._id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                  <CategoryChip category={tx.category} type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {tx.description || tx.category}
                      </p>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount, user?.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{fmtDate(tx.date)}</span>
                      <span className={tx.type === 'income' ? 'badge-income' : 'badge-expense'} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {tx.type}
                      </span>
                      {tx.isRecurring && <RefreshCw size={10} className="text-blue-400" />}
                    </div>
                  </div>
                  <ActionMenu onEdit={() => openEdit(tx)} onDelete={() => handleDelete(tx._id)} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-100 gap-2">
              <p className="text-xs text-slate-400 order-2 sm:order-1">
                Showing <span className="font-medium text-slate-600">{((pagination.page - 1) * filters.limit) + 1}–{Math.min(pagination.page * filters.limit, pagination.total)}</span> of <span className="font-medium text-slate-600">{pagination.total}</span> transactions
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-sm text-slate-600 px-1 tabular-nums">
                  {pagination.page} <span className="text-slate-400">/</span> {pagination.pages}
                </span>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  aria-label="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTx ? 'Edit Transaction' : 'New Transaction'}>
        <div className="space-y-4">

          {/* Type picker pills */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t, category: '' })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150
                    ${form.type === t
                      ? t === 'income'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  {t === 'income' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {formErrors.type && <p className="text-xs text-red-500">{formErrors.type}</p>}
          </div>

          {/* Category */}
          <Select
            label="Category"
            value={form.category}
            onChange={setF('category')}
            error={formErrors.category}
          >
            <option value="">Select category…</option>
            {(CATEGORIES[form.type] || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>

          {/* Amount + Date in row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={setF('amount')}
                  className={`input-field pl-7 ${formErrors.amount ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                />
              </div>
              {formErrors.amount && <p className="text-xs text-red-500">{formErrors.amount}</p>}
            </div>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={setF('date')}
              error={formErrors.date}
            />
          </div>

          {/* Description */}
          <Input
            label="Description (optional)"
            placeholder="e.g. Monthly rent, Coffee with team…"
            value={form.description}
            onChange={setF('description')}
          />

          {/* Recurring toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="sr-only"
                id="recurring-toggle"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 ${form.isRecurring ? 'bg-emerald-500' : 'bg-slate-200'}`}
                onClick={() => setForm({ ...form, isRecurring: !form.isRecurring })}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform duration-200 ${form.isRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <RefreshCw size={13} className="text-slate-400" /> Recurring transaction
              </p>
              <p className="text-xs text-slate-400 mt-0.5">This transaction repeats on a regular basis</p>
            </div>
          </label>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : editTx ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
