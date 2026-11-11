import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, ArrowUpCircle, ArrowDownCircle, DollarSign,
  ChevronLeft, ChevronRight, X, RotateCcw, RefreshCw, Calendar,
  Edit2, Trash2, ArrowUpRight, ArrowDownRight
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
  expense: [
    'Food & Dining', 'Housing', 'Transportation', 'Healthcare',
    'Entertainment', 'Shopping', 'Education', 'Utilities',
    'Insurance', 'Travel', 'Personal Care', 'Other Expense'
  ],
};

const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income];

/**
 * Currency formatter with comprehensive fallback protection
 */
const fmt = (n, currency = 'USD') => {
  const code = (typeof currency === 'string' && currency.trim()) ? currency.trim().toUpperCase() : 'USD';
  const val = Number(n) || 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    }).format(val);
  } catch {
    return `$${val.toLocaleString()}`;
  }
};

/**
 * Date formatter with safety fallback
 */
const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime())
      ? '—'
      : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
};

const EMPTY_FORM = {
  type: 'expense',
  category: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  isRecurring: false,
};

const DEFAULT_FILTERS = {
  type: '',
  category: '',
  search: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 15,
  sort: '-date',
};

export default function Transactions() {
  const { user } = useAuth();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 15 });
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
      const typeParam = searchParams.get('type') === 'income' ? 'income' : 'expense';
      openCreate(typeParam);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        next.delete('type');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const handleQuickTx = (e) => {
      const initialType = e?.detail?.type === 'income' ? 'income' : 'expense';
      openCreate(initialType);
    };
    window.addEventListener('fht:quick-transaction', handleQuickTx);
    return () => window.removeEventListener('fht:quick-transaction', handleQuickTx);
  }, []);

  /* ── Robust Data Fetching ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );

      const [txRes, sumRes] = await Promise.allSettled([
        transactionsAPI.getAll(params),
        transactionsAPI.getSummary({ months: 2 }),
      ]);

      // Normalize transactions payload
      let rawTxs = [];
      let rawPagination = { total: 0, pages: 1, page: 1, limit: 15 };

      if (txRes.status === 'fulfilled' && txRes.value?.data) {
        const txPayload = txRes.value.data;
        if (Array.isArray(txPayload.data)) {
          rawTxs = txPayload.data;
        } else if (Array.isArray(txPayload.data?.transactions)) {
          rawTxs = txPayload.data.transactions;
        } else if (Array.isArray(txPayload.transactions)) {
          rawTxs = txPayload.transactions;
        } else if (Array.isArray(txPayload)) {
          rawTxs = txPayload;
        }

        const pageInfo = txPayload.pagination || txPayload.data?.pagination;
        if (pageInfo && typeof pageInfo === 'object') {
          rawPagination = {
            total: Number(pageInfo.total) || rawTxs.length,
            pages: Math.max(1, Number(pageInfo.pages) || 1),
            page: Math.max(1, Number(pageInfo.page) || 1),
            limit: Number(pageInfo.limit) || 15,
          };
        } else {
          rawPagination = {
            total: rawTxs.length,
            pages: Math.max(1, Math.ceil(rawTxs.length / 15)),
            page: 1,
            limit: 15,
          };
        }
      }

      setTransactions(rawTxs);
      setPagination(rawPagination);

      // Normalize summary payload
      let rawSummary = [];
      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        const sumPayload = sumRes.value.data;
        if (Array.isArray(sumPayload.data?.summary)) {
          rawSummary = sumPayload.data.summary;
        } else if (Array.isArray(sumPayload.summary)) {
          rawSummary = sumPayload.summary;
        } else if (Array.isArray(sumPayload.data)) {
          rawSummary = sumPayload.data;
        } else if (Array.isArray(sumPayload)) {
          rawSummary = sumPayload;
        }
      }
      setSummary(rawSummary);

    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error('Failed to load transactions.');
      setTransactions([]);
      setPagination({ total: 0, pages: 1, page: 1, limit: 15 });
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Modal helpers ── */
  const openCreate = (initialType = 'expense') => {
    setEditTx(null);
    setForm({
      ...EMPTY_FORM,
      type: initialType === 'income' ? 'income' : 'expense',
      date: new Date().toISOString().slice(0, 10),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (tx) => {
    if (!tx) return;
    setEditTx(tx);
    setForm({
      type: tx?.type === 'income' ? 'income' : 'expense',
      category: tx?.category || '',
      amount: tx?.amount ?? '',
      date: tx?.date ? String(tx.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      description: tx?.description || '',
      isRecurring: Boolean(tx?.isRecurring),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  /* ── Form Validation ── */
  const validate = () => {
    const e = {};
    if (!form.type) e.type = 'Type is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Must be greater than 0';
    if (!form.date) e.date = 'Date is required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Save (Create / Update) ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        description: form.description?.trim() || '',
        isRecurring: Boolean(form.isRecurring),
      };

      if (editTx?._id || editTx?.id) {
        const id = editTx._id || editTx.id;
        await transactionsAPI.update(id, payload);
        toast.success('Transaction updated.');
      } else {
        await transactionsAPI.create(payload);
        toast.success('Transaction added.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await transactionsAPI.delete(id);
      toast.success('Transaction deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete transaction.');
    }
  };

  /* ── Filter Helpers ── */
  const setF = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setFilter = (field) => (e) => setFilters((prev) => ({ ...prev, [field]: e.target.value, page: 1 }));
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters = Boolean(
    filters.type || filters.category || filters.search || filters.startDate || filters.endDate
  );

  /* ── KPI Metrics Calculations (Strict Null Safety) ── */
  const summaryArray = Array.isArray(summary) ? summary : [];
  const cur = summaryArray.length > 0 ? (summaryArray[summaryArray.length - 1] || {}) : {};
  const prev = summaryArray.length > 1 ? (summaryArray[summaryArray.length - 2] || {}) : {};

  const curIncome = Number(cur?.income) || 0;
  const curExpense = Number(cur?.expense) || 0;
  const prevIncome = Number(prev?.income) || 0;
  const prevExpense = Number(prev?.expense) || 0;

  const net = curIncome - curExpense;

  const incomeGrowth = prevIncome > 0
    ? (((curIncome - prevIncome) / prevIncome) * 100).toFixed(1)
    : null;

  const expenseGrowth = prevExpense > 0
    ? (((curExpense - prevExpense) / prevExpense) * 100).toFixed(1)
    : null;

  const savingsRate = curIncome > 0
    ? (((curIncome - curExpense) / curIncome) * 100).toFixed(1)
    : '0';

  // Currency wording for subtitle
  const currencyWording = user?.currency === 'EUR'
    ? 'euro'
    : user?.currency === 'GBP'
    ? 'pound'
    : user?.currency === 'INR'
    ? 'rupee'
    : 'dollar';

  // Safe transactions array
  const safeTransactions = useMemo(() => {
    return Array.isArray(transactions) ? transactions : [];
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Top Header: Transaction Tracker + Add Expense & Add Income buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transaction Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log and review every {currencyWording} in and out.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {/* + Add Income button */}
          <button
            type="button"
            onClick={() => openCreate('income')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} className="text-emerald-600" />
            <span>Add Income</span>
          </button>

          {/* + Add Expense button */}
          <button
            type="button"
            onClick={() => openCreate('expense')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* ── 3 Top KPI Cards (grid md:grid-cols-3 gap-6) ── */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-36 flex flex-col justify-between animate-pulse"
            >
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
        <div className="grid md:grid-cols-3 gap-6">
          {/* INCOME THIS MONTH */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Income This Month
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ArrowUpCircle size={18} />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight my-2">
              {fmt(curIncome, user?.currency)}
            </p>
            <div className="flex items-center text-xs">
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                {incomeGrowth !== null ? (
                  <>
                    <ArrowUpRight size={12} />
                    {incomeGrowth >= 0 ? `+${incomeGrowth}%` : `${incomeGrowth}%`} vs last month
                  </>
                ) : (
                  'Stable vs last month'
                )}
              </span>
            </div>
          </div>

          {/* EXPENSES THIS MONTH */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Expenses This Month
              </span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <ArrowDownCircle size={18} />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight my-2">
              {fmt(curExpense, user?.currency)}
            </p>
            <div className="flex items-center text-xs">
              <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                {expenseGrowth !== null ? (
                  <>
                    <ArrowDownRight size={12} />
                    {expenseGrowth >= 0 ? `+${expenseGrowth}%` : `${expenseGrowth}%`} vs last month
                  </>
                ) : (
                  'Stable vs last month'
                )}
              </span>
            </div>
          </div>

          {/* NET CASHFLOW */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Net Cashflow
              </span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <DollarSign size={18} />
              </span>
            </div>
            <p className={`text-3xl font-bold tracking-tight my-2 ${net >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {net >= 0 ? '+' : ''}{fmt(net, user?.currency)}
            </p>
            <div className="flex items-center text-xs">
              <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                {savingsRate}% savings rate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── High-Contrast FinTech Table Card with Unified Toolbar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Top bar: Segmented switcher & Unified filter toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50">
          
          {/* Segmented Switcher (Expenses / Income / All) */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 w-full sm:w-auto">
            {[
              { label: 'All', value: '' },
              { label: '↓ Expenses', value: 'expense' },
              { label: '↑ Income', value: 'income' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, type: tab.value, page: 1 }))}
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
                value={filters.search || ''}
                onChange={setFilter('search')}
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, search: '', page: 1 }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs cursor-pointer appearance-none"
              value={filters.category || ''}
              onChange={setFilter('category')}
            >
              <option value="">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset filters"
                aria-label="Reset filters"
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
        ) : safeTransactions.length === 0 ? (
          <div className="py-16 text-center px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
              <Calendar size={22} className="stroke-[2.2]" />
            </div>
            <p className="text-sm font-bold text-slate-800">No transactions recorded</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {hasActiveFilters
                ? 'No records match your filters. Try clearing search or category filters.'
                : 'Add your first income or expense transaction to start tracking.'}
            </p>
            {!hasActiveFilters && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => openCreate('expense')}
                  size="sm"
                  className="rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} /> Add Expense
                </Button>
                <Button
                  onClick={() => openCreate('income')}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} /> Add Income
                </Button>
              </div>
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
                {safeTransactions.map((tx, idx) => {
                  const txId = tx?._id || tx?.id || `tx-${idx}`;
                  const isIncome = tx?.type === 'income';
                  const amount = Number(tx?.amount ?? 0);
                  const displayDate = fmtDate(tx?.date);
                  const note = tx?.description || tx?.category || 'Untitled';

                  return (
                    <tr key={txId} className="hover:bg-slate-50/80 transition-colors text-sm">
                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {displayDate}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {tx?.category || 'General'}
                        </span>
                      </td>

                      {/* Note / Description */}
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{note}</span>
                          {Boolean(tx?.isRecurring) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md font-medium">
                              <RefreshCw size={9} /> recurring
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-sm">
                        <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                          {isIncome ? '+' : '-'}{fmt(amount, user?.currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(tx)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit transaction"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(txId)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete transaction"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-600 gap-2">
          <span>
            {pagination?.total ?? safeTransactions.length} RECORD
            {(pagination?.total ?? safeTransactions.length) === 1 ? '' : 'S'} TOTAL
          </span>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              disabled={(pagination?.page ?? 1) <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-slate-500 px-1 font-medium">
              Page {pagination?.page ?? 1} of {pagination?.pages ?? 1}
            </span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              disabled={(pagination?.page ?? 1) >= (pagination?.pages ?? 1)}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ── Add / Edit Modal (fixed inset-0 z-50) ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTx ? 'Edit Transaction' : 'New Transaction'}
      >
        <div className="space-y-4">
          {/* Type picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'expense', label: 'Expense', icon: ArrowDownCircle },
                { type: 'income', label: 'Income', icon: ArrowUpCircle },
              ].map(({ type: t, label, icon: Icon }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: t, category: '' }))}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    form.type === t
                      ? t === 'income'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                        : 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
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
            {((CATEGORIES[form.type]) || []).map((c) => (
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
                  className={`input-field pl-7 ${
                    formErrors.amount ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''
                  }`}
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

          {/* Note / Description */}
          <Input
            label="Note / Description (optional)"
            placeholder="e.g. Monthly rent, Client deposit…"
            value={form.description}
            onChange={setF('description')}
          />

          {/* Recurring Toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm((prev) => ({ ...prev, isRecurring: e.target.checked }))}
                className="sr-only"
                id="recurring-toggle"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                  form.isRecurring ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
                onClick={() => setForm((prev) => ({ ...prev, isRecurring: !prev.isRecurring }))}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-xs absolute top-0.5 transition-transform duration-200 ${
                    form.isRecurring ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <RefreshCw size={13} className="text-indigo-600" /> Recurring transaction
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Repeats on a scheduled monthly basis</p>
            </div>
          </label>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1 rounded-xl"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl"
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
