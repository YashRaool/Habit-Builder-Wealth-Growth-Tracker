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
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import PageHeader from '../components/layout/PageHeader';
import { StatCardSkeleton, TableSkeleton } from '../components/ui/Skeleton';

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

/* ─── Category Icon Chip ────────────────────────────────────────── */
function CategoryChip({ category, type }) {
  const Icon = CATEGORY_ICONS[category] || Wallet;
  const isIncome = type === 'income';
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border shrink-0 ${
        isIncome
          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
          : 'bg-slate-100/80 border-slate-200/80 text-slate-500'
      }`}
    >
      <Icon size={15} />
    </span>
  );
}

/* ─── Row Action Menu ───────────────────────────────────────────── */
function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        aria-label="Row actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-slate-200/90 rounded-xl shadow-elevated py-1 animate-fade-in">
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={13} className="text-slate-400" /> Edit
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={13} className="text-rose-500" /> Delete
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditTx(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (tx) => {
    setEditTx(tx);
    setForm({
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      date: tx.date?.slice(0, 10),
      description: tx.description || '',
      isRecurring: tx.isRecurring || false,
    });
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
    if (!window.confirm('Delete this transaction record?')) return;
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Transactions Ledger"
        description="Filter, audit, and log verified capital inflows and expenditures."
      >
        <Button onClick={openCreate} size="sm">
          <Plus size={15} /> Add Transaction
        </Button>
      </PageHeader>

      {/* KPI Cards with tabular nums */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={ArrowUpCircle}
              label="Total Month Income"
              value={<span className="tabular-nums">{fmt(cur.income, user?.currency)}</span>}
              color="emerald"
            />
            <StatCard
              icon={ArrowDownCircle}
              label="Total Month Expenses"
              value={<span className="tabular-nums">{fmt(cur.expense, user?.currency)}</span>}
              color="red"
            />
            <StatCard
              icon={DollarSign}
              label="Net Month Flow"
              value={<span className="tabular-nums">{fmt(net, user?.currency)}</span>}
              color={net >= 0 ? 'emerald' : 'red'}
            />
          </>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <Input
              id="transaction-search"
              placeholder="Search by description or category..."
              icon={Search}
              value={filters.search}
              onChange={setFilter('search')}
              rightElement={
                filters.search ? (
                  <button
                    onClick={() => setFilters({ ...filters, search: '', page: 1 })}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : null
              }
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center justify-center flex-1 sm:flex-none gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
                ${
                  showFilters || hasActiveFilters
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Filter size={14} />
              Filter Options
              {hasActiveFilters && (
                <span className="w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {[filters.type, filters.category, filters.startDate, filters.endDate].filter(Boolean).length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 rounded-xl transition-colors shrink-0"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
            <Select label="Type" value={filters.type} onChange={setFilter('type')}>
              <option value="">All Flow Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            <Select label="Category" value={filters.category} onChange={setFilter('category')}>
              <option value="">All Categories</option>
              {[...CATEGORIES.income, ...CATEGORIES.expense].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input label="From Date" type="date" value={filters.startDate} onChange={setFilter('startDate')} />
            <Input label="To Date" type="date" value={filters.endDate} onChange={setFilter('endDate')} />
          </div>
        )}

        {/* Sort Chips */}
        <div className="mt-3 pt-2 flex items-center gap-2 flex-wrap">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold shrink-0">Sort:</span>
          {[
            { label: 'Newest', value: '-date' },
            { label: 'Oldest', value: 'date' },
            { label: 'Highest Amount', value: '-amount' },
            { label: 'Lowest Amount', value: 'amount' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilters({ ...filters, sort: value, page: 1 })}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
                ${
                  filters.sort === value
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Transaction Table Card */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/70">
              <DollarSign size={24} className="text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">No transactions match your criteria</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasActiveFilters ? 'Reset filters to see more ledger history.' : 'Record your first transaction to initiate metrics.'}
              </p>
            </div>
            {!hasActiveFilters ? (
              <Button onClick={openCreate} size="sm"><Plus size={14} /> Add Transaction</Button>
            ) : (
              <Button onClick={resetFilters} variant="secondary" size="sm">
                <RotateCcw size={13} /> Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</th>
                    <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="text-right px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr
                      key={tx._id}
                      className="group hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      {/* Description & Category Icon */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <CategoryChip category={tx.category} type={tx.type} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                              {tx.description || tx.category}
                            </p>
                            {tx.isRecurring && (
                              <p className="text-2xs text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                                <RefreshCw size={10} /> recurring automated
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-5 py-3.5">
                        <Badge color="slate" size="sm">{tx.category}</Badge>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                          <Calendar size={13} className="text-slate-400" />
                          {fmtDate(tx.date)}
                        </span>
                      </td>

                      {/* Semantic Flow Badge */}
                      <td className="px-5 py-3.5">
                        <Badge color={tx.type === 'income' ? 'emerald' : 'rose'} size="sm">
                          {tx.type === 'income' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          <span className="capitalize">{tx.type}</span>
                        </Badge>
                      </td>

                      {/* Tabular Amount */}
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount, user?.currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionMenu onEdit={() => openEdit(tx)} onDelete={() => handleDelete(tx._id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                  <CategoryChip category={tx.category} type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {tx.description || tx.category}
                      </p>
                      <span
                        className={`text-xs font-bold tabular-nums shrink-0 ${
                          tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount, user?.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xs text-slate-400 tabular-nums">{fmtDate(tx.date)}</span>
                      <Badge color={tx.type === 'income' ? 'emerald' : 'rose'} size="sm">
                        {tx.type}
                      </Badge>
                      {tx.isRecurring && <RefreshCw size={10} className="text-blue-500" />}
                    </div>
                  </div>
                  <ActionMenu onEdit={() => openEdit(tx)} onDelete={() => handleDelete(tx._id)} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-100 gap-2.5 bg-slate-50/40">
              <p className="text-2xs text-slate-500 order-2 sm:order-1">
                Showing{' '}
                <span className="font-semibold text-slate-800 tabular-nums">
                  {((pagination.page - 1) * filters.limit) + 1}–{Math.min(pagination.page * filters.limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-800 tabular-nums">{pagination.total}</span> entries
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs text-slate-700 font-medium px-1 tabular-nums">
                  {pagination.page} <span className="text-slate-400">/</span> {pagination.pages}
                </span>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
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
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTx ? 'Edit Transaction' : 'Record Transaction'}
      >
        <div className="space-y-4">
          {/* Flow Type selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Flow Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={saving}
                  onClick={() => setForm({ ...form, type: t, category: '' })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
                    ${
                      form.type === t
                        ? t === 'income'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                          : 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  {t === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="capitalize">{t}</span>
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
            disabled={saving}
          >
            <option value="">Select category…</option>
            {(CATEGORIES[form.type] || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          {/* Amount + Date in row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount ($)"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={setF('amount')}
              error={formErrors.amount}
              disabled={saving}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={setF('date')}
              error={formErrors.date}
              disabled={saving}
            />
          </div>

          {/* Description */}
          <Input
            label="Description (optional)"
            placeholder="e.g. Monthly rent, Client retainer..."
            value={form.description}
            onChange={setF('description')}
            disabled={saving}
          />

          {/* Recurring toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isRecurring}
                disabled={saving}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="sr-only"
                id="recurring-toggle"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                  form.isRecurring ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
                onClick={() => !saving && setForm({ ...form, isRecurring: !form.isRecurring })}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-xs absolute top-0.5 transition-transform duration-200 ${
                    form.isRecurring ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <RefreshCw size={12} className="text-slate-400" /> Recurring Schedule
              </p>
              <p className="text-2xs text-slate-400 mt-0.5">Automate or flag recurring cash flows</p>
            </div>
          </label>

          {/* Action buttons with submission locking */}
          <div className="flex gap-2.5 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Recording...' : editTx ? 'Save Updates' : 'Add Transaction'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
