import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, LineChart as ChartIcon } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { wealthAPI } from '../api/wealth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import PageHeader from '../components/layout/PageHeader';
import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton';

const ASSET_TYPES = ['Stocks', 'Crypto', 'Real Estate', 'Cash & Savings', 'Bonds', 'Mutual Funds', 'ETF', 'Commodity', 'Other'];
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#0ea5e9', '#f43f5e', '#8b5cf6', '#14b8a6', '#ec4899', '#f97316'];

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;

const EMPTY_FORM = { name: '', assetType: 'ETF', valuation: '', investedAmount: '', ticker: '', quantity: '', notes: '' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-3 text-xs shadow-elevated animate-fade-in min-w-[130px]">
      <p className="font-semibold text-slate-900 mb-1.5 pb-1 border-b border-slate-100">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey || p.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.stroke }} />
              {p.name}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Wealth() {
  const { user } = useAuth();
  const toast = useToast();
  const [netWorth, setNetWorth] = useState(null);
  const [history, setHistory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6m');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [nwRes, histRes] = await Promise.all([
        wealthAPI.getNetWorth(),
        wealthAPI.getHistory({ period }),
      ]);
      setNetWorth(nwRes.data.data);
      setAssets(nwRes.data.data.assets || []);
      setHistory(histRes.data.data.history || []);
    } catch {
      toast.error('Failed to load wealth data.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditAsset(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditAsset(a);
    setForm({
      name: a.name,
      assetType: a.assetType,
      valuation: a.valuation,
      investedAmount: a.investedAmount,
      ticker: a.ticker || '',
      quantity: a.quantity || '',
      notes: a.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.assetType || !form.valuation || !form.investedAmount) {
      return toast.error('Name, type, valuation, and invested amount are required.');
    }
    setSaving(true);
    try {
      if (editAsset) {
        await wealthAPI.updateAsset(editAsset._id, form);
        toast.success('Asset updated.');
      } else {
        await wealthAPI.createAsset(form);
        toast.success('Asset added!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset from portfolio?')) return;
    try {
      await wealthAPI.deleteAsset(id);
      toast.success('Asset deleted.');
      fetchData();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const pieData = netWorth?.byType
    ? Object.entries(netWorth.byType).map(([name, value]) => ({ name, value }))
    : [];

  const totalReturn = netWorth?.totalReturn || 0;
  const netGainLoss = (netWorth?.totalValuation || 0) - (netWorth?.totalInvested || 0);

  const hasHistoryData = history && history.length > 0 && history.some((h) => h.netWorth > 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton height="h-72" />
          </div>
          <div>
            <ChartSkeleton height="h-72" />
          </div>
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Wealth Portfolio"
        description="Comprehensive asset balance sheet, historical valuation growth, and capital allocation."
      >
        <Button onClick={openCreate} size="sm">
          <Plus size={15} /> Add Asset
        </Button>
      </PageHeader>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Net Worth"
          value={<span className="tabular-nums">{fmt(netWorth?.totalValuation || 0, user?.currency)}</span>}
          color="emerald"
        />
        <StatCard
          icon={TrendingDown}
          label="Cost Basis (Invested)"
          value={<span className="tabular-nums">{fmt(netWorth?.totalInvested || 0, user?.currency)}</span>}
          color="blue"
        />
        <StatCard
          icon={totalReturn >= 0 ? TrendingUp : TrendingDown}
          label="Unrealized Capital Return"
          value={<span className="tabular-nums">{fmtPct(totalReturn)}</span>}
          sub={<span className="tabular-nums font-semibold">{fmt(netGainLoss, user?.currency)} net capital gain</span>}
          color={totalReturn >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth History Line Chart */}
        <Card className="lg:col-span-2 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-900 tracking-tight text-base flex items-center gap-2">
                <ChartIcon size={17} className="text-emerald-600" /> Valuation Growth History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Historical portfolio progression</p>
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              {['6m', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    period === p
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p === '6m' ? '6 Months' : '1 Year'}
                </button>
              ))}
            </div>
          </div>
          {hasHistoryData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    name="Net Worth"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
                <ChartIcon size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Valuation Telemetry</h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm mb-4 leading-relaxed">
                Log your initial asset positions to start generating balance sheet equity curves.
              </p>
              <Button onClick={openCreate} size="sm">
                <Plus size={14} /> Add First Asset
              </Button>
            </div>
          )}
        </Card>

        {/* Asset Allocation Pie Chart */}
        <Card className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 tracking-tight text-base flex items-center gap-2">
                <PieIcon size={17} className="text-indigo-600" /> Asset Allocation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Asset diversification breakdown</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
                <PieIcon size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Asset Diversification</h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs leading-relaxed">
                Asset allocation across stocks, crypto, and cash will render here.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Holdings Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm tracking-tight">Portfolio Holdings</h2>
            <p className="text-2xs text-slate-400 mt-0.5">Individual asset valuation and performance</p>
          </div>
          <Badge color="emerald" size="sm" variant="rounded">
            {assets.length} Assets
          </Badge>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-16 text-slate-400 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center mx-auto mb-3">
              <Wallet size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">No assets recorded in portfolio</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
              Add your index funds, real estate, cash reserves, or crypto holdings to track growth.
            </p>
            <Button onClick={openCreate} size="sm" className="mt-4"><Plus size={14} /> Add Asset</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                  <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="text-right px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Current Valuation</th>
                  <th scope="col" className="text-right px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Cost Basis</th>
                  <th scope="col" className="text-right px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Total Return</th>
                  <th scope="col" className="text-right px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((a) => {
                  const returnPct = a.investedAmount > 0 ? (((a.valuation - a.investedAmount) / a.investedAmount) * 100) : 0;
                  return (
                    <tr key={a._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-slate-900">{a.name}</p>
                        {a.ticker && (
                          <p className="text-2xs text-slate-400 font-mono mt-0.5">
                            {a.ticker}{a.quantity ? ` · ${a.quantity} units` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge color="slate" size="sm" variant="rounded">
                          {a.assetType}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-900 text-right tabular-nums">
                        {fmt(a.valuation, user?.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 text-right tabular-nums">
                        {fmt(a.investedAmount, user?.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`text-xs font-bold tabular-nums inline-flex items-center gap-1 ${
                            returnPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => openEdit(a)} 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                            aria-label="Edit asset"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            onClick={() => handleDelete(a._id)} 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            aria-label="Delete asset"
                          >
                            <Trash2 size={13} />
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
      </Card>

      {/* Add/Edit Asset Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAsset ? 'Edit Asset' : 'Add Holding'}>
        <div className="space-y-4">
          <Input
            label="Asset name"
            placeholder="e.g. S&P 500 ETF (VOO)"
            value={form.name}
            onChange={set('name')}
            disabled={saving}
          />
          <Select label="Asset type" value={form.assetType} onChange={set('assetType')} disabled={saving}>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Current valuation ($)"
              type="number"
              min="0"
              placeholder="10000.00"
              value={form.valuation}
              onChange={set('valuation')}
              disabled={saving}
            />
            <Input
              label="Amount invested ($)"
              type="number"
              min="0"
              placeholder="8500.00"
              value={form.investedAmount}
              onChange={set('investedAmount')}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ticker (optional)"
              placeholder="e.g. VOO, BTC"
              value={form.ticker}
              onChange={set('ticker')}
              disabled={saving}
            />
            <Input
              label="Quantity (optional)"
              type="number"
              min="0"
              step="any"
              placeholder="25.5"
              value={form.quantity}
              onChange={set('quantity')}
              disabled={saving}
            />
          </div>
          <Input
            label="Notes (optional)"
            placeholder="e.g. Core index holding in taxable brokerage"
            value={form.notes}
            onChange={set('notes')}
            disabled={saving}
          />
          <div className="flex gap-2.5 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editAsset ? 'Save Updates' : 'Add Asset'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
