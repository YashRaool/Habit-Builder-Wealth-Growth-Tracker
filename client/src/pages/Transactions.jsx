import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, ArrowUpCircle, ArrowDownCircle, DollarSign,
  ChevronLeft, ChevronRight, X, RotateCcw, RefreshCw, Calendar
} from 'lucide-react';
import { transactionsAPI } from '../api/transactions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import { SkeletonRow } from '../components/ui/Skeleton';

/* ─── Constants ────────────────────────────────────────────────── */

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Gift', 'Other Income'],
  expense: ['Food & Dining', 'Housing', 'Transportation', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Utilities', 'Insurance', 'Travel', 'Personal Care', 'Other Expense'],
};

const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income];

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const EMPTY_FORM = {
  type: 'expense', category: '', amount: '',
  date: new Date().toISOString().slice(0, 10), description: '', isRecurring: false,
};

const DEFAULT_FILTERS = { type: '', category: '', search: '', startDate: '', endDate: '', page: 1, limit: 15, sort: '-date' };

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
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Open create modal if action=new or via quick-transaction event ── */
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreate();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    const handleQuickTx = () => openCreate();
    window.addEventListener('fht:quick-transaction', handleQuickTx);
    return () => window.removeEventListener('fht:quick-transaction', handleQuickTx);
  }, []);

  /* ── Data fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [txRes, sumRes] = await Promise.all([
        transactionsAPI.getAll(params),
        transactionsAPI.getSummary({ months: 2 }),
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

  /* ── Validation ── */
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
  const prev = summary[summary.length - 2] || { income: 0, expense: 0 };
  const net = cur.income - cur.expense;

  const incomeGrowth = prev.income > 0 ? (((cur.income - prev.income) / prev.income) * 100).toFixed(1) : null;
  const expenseGrowth = prev.expense > 0 ? (((cur.expense - prev.expense) / prev.expense) * 100).toFixed(1) : null;

  // Currency descriptive wording
  const currencyWording = user?.currency === 'EUR' ? 'euro' : user?.currency === 'GBP' ? 'pound' : user?.currency === 'INR' ? 'rupee' : 'dollar';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log and review every {currencyWording} in and out.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto shrink-0 shadow-xs" size="sm">
          <Plus size={16} /> Add Transaction
        </Button>
      </div>

      {/* ── 1 & 2. Top 3 KPI Summary Cards with Zero Flash Skeletons ── */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-36 flex flex-col justify-between animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-32 bg-slate-200/80 rounded-md" />
                <div className="w-8 h-8 rounded-xl bg-slate-200/60" />
              </div>
              <div className="h-8 w-36 bg-slate-200/90 rounded-lg" />
              <div className="h-4 w-28 bg-slate-200/60 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* INCOME THIS MONTH */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Income This Month</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ArrowUpCircle size={18} />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight my-2">
              {fmt(cur.income, user?.currency)}
            </p>
            <div className="flex items-center text-xs">
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                {incomeGrowth !== null ? `${incomeGrowth >= 0 ? '+' : ''}${incomeGrowth}%` : 'Stable'} vs last month
              </span>
            </div>
          </div>

          {/* EXPENSES THIS MONTH */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expenses This Month</span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <ArrowDownCircle size={18} />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight my-2">
              {fmt(cur.expense, user?.currency)}
            </p>
            <div className="flex items-center text-xs">
              <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                {expenseGrowth !== null ? `${expenseGrowth >= 0 ? '+' : ''}${expenseGrowth}%` : 'Stable'} vs last month
              </span>
            </div>
          </div>

          {/* NET CASHFLOW */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Cashflow</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <DollarSign size={18} />
              </span>
            </div>
            <p className={`text-3xl font-bold tracking-tight my-2 ${net >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {net >= 0 ? '+' : ''}{fmt(net, user?.currency)}
            </p>
            <div className="flex items-center text-xs">
              <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                {cur.income > 0 ? (((cur.income - cur.expense) / cur.income) * 100).toFixed(1) : 0}% savings rate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3 & 4. High-Contrast FinTech Table Card with Unified Toolbar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Top bar: Segmented switcher & Unified filter toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50">
          
          {/* Segmented Switcher (All / Expenses / Income) */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 w-full sm:w-auto">
            {[
              { label: 'All', value: '' },
              { label: '↓ Expenses', value: 'expense' },
              { label: '↑ Income', value: 'income' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilters({ ...filters, type: tab.value, page: 1 })}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  filters.type === tab.value
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Category Dropdown */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                placeholder="Search records…"
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs"
                value={filters.search}
                onChange={setFilter('search')}
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: '', page: 1 })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs cursor-pointer appearance-none"
              value={filters.category}
              onChange={setFilter('category')}
            >
              <option value="">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Reset filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} cols={5} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
              <Calendar size={22} className="stroke-[2.2]" />
            </div>
            <p className="text-sm font-bold text-slate-800">No transactions recorded</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {hasActiveFilters ? 'No records match your filters. Try clearing search or category filters.' : 'Add your first income or expense transaction to start tracking.'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={openCreate} size="sm" className="mt-3.5 rounded-xl flex items-center gap-1.5 shadow-xs">
                <Plus size={14} /> Add Transaction
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th scope="col" className="py-3.5 px-4">Date</th>
                  <th scope="col" className="py-3.5 px-4">Category</th>
                  <th scope="col" className="py-3.5 px-4">Note</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Amount</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors text-sm">
                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {fmtDate(tx.date)}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {tx.category}
                      </span>
                    </td>

                    {/* Note / Description */}
                    <td className="py-3 px-4 text-slate-900 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-xs">{tx.description || tx.category}</span>
                        {tx.isRecurring && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md font-medium">
                            <RefreshCw size={9} /> recurring
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-sm">
                      <span className={tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, user?.currency)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(tx)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tx._id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-600 gap-2">
          <span>
            {pagination.total} RECORD{pagination.total === 1 ? '' : 'S'} TOTAL
          </span>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={pagination.page <= 1}
              onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-slate-500 px-1 font-medium">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTx ? 'Edit Transaction' : 'New Transaction'}>
        <div className="space-y-4">
          {/* Type picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t, category: '' })}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    form.type === t
                      ? t === 'income'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                        : 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'income' ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {formErrors.type && <p className="text-xs text-rose-500">{formErrors.type}</p>}
          </div>

          {/* Category */}
          <Select
            label="Category"
            value={form.category}
            onChange={setF('category')}
            error={formErrors.category}
          >
            <option value="">Select category…</option>
            {(CATEGORIES[form.type] || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={setF('amount')}
                  className={`input-field pl-7 ${formErrors.amount ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
                />
              </div>
              {formErrors.amount && <p className="text-xs text-rose-500">{formErrors.amount}</p>}
            </div>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={setF('date')}
              error={formErrors.date}
            />
          </div>

          <Input
            label="Note / Description (optional)"
            placeholder="e.g. Monthly rent, Client deposit…"
            value={form.description}
            onChange={setF('description')}
          />

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="sr-only"
                id="recurring-toggle"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 ${form.isRecurring ? 'bg-indigo-600' : 'bg-slate-200'}`}
                onClick={() => setForm({ ...form, isRecurring: !form.isRecurring })}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-xs absolute top-0.5 transition-transform duration-200 ${form.isRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <RefreshCw size={13} className="text-indigo-600" /> Recurring transaction
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Repeats on a scheduled monthly basis</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editTx ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
