import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { wealthAPI } from '../api/wealth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const ASSET_TYPES = ['Stocks', 'Crypto', 'Real Estate', 'Cash & Savings', 'Bonds', 'Mutual Funds', 'ETF', 'Commodity', 'Other'];
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#f97316'];

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;

const EMPTY_FORM = { name: '', assetType: 'ETF', valuation: '', investedAmount: '', ticker: '', quantity: '', notes: '' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm shadow-xl">
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditAsset(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (a) => {
    setEditAsset(a);
    setForm({ name: a.name, assetType: a.assetType, valuation: a.valuation, investedAmount: a.investedAmount, ticker: a.ticker || '', quantity: a.quantity || '', notes: a.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.assetType || !form.valuation || !form.investedAmount) {
      return toast.error('Name, type, valuation, and invested amount are required.');
    }
    setSaving(true);
    try {
      if (editAsset) { await wealthAPI.updateAsset(editAsset._id, form); toast.success('Asset updated.'); }
      else { await wealthAPI.createAsset(form); toast.success('Asset added!'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    try { await wealthAPI.deleteAsset(id); toast.success('Asset deleted.'); fetchData(); }
    catch { toast.error('Delete failed.'); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  // Pie data from byType
  const pieData = netWorth?.byType
    ? Object.entries(netWorth.byType).map(([name, value]) => ({ name, value }))
    : [];

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const totalReturn = netWorth?.totalReturn || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Wealth Portfolio</h1>
          <p className="text-slate-500 text-sm">Track your assets and net worth growth</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add Asset</Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Total Net Worth" value={fmt(netWorth?.totalValuation || 0, user?.currency)} color="emerald" />
        <StatCard icon={TrendingDown} label="Total Invested" value={fmt(netWorth?.totalInvested || 0, user?.currency)} color="blue" />
        <StatCard
          icon={totalReturn >= 0 ? TrendingUp : TrendingDown}
          label="Total Return"
          value={fmtPct(totalReturn)}
          sub={fmt((netWorth?.totalValuation || 0) - (netWorth?.totalInvested || 0), user?.currency) + ' gain/loss'}
          color={totalReturn >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net worth history */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Net Worth History</h2>
            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
              {['6m', '1y'].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${period === p ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
                  {p === '6m' ? '6 Months' : '1 Year'}
                </button>
              ))}
            </div>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No history data yet. Add assets to see trends.</div>
          )}
        </div>

        {/* Asset allocation pie */}
        <div className="card">
          <h2 className="font-semibold text-slate-200 mb-4">Asset Allocation</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No assets yet</div>
          )}
        </div>
      </div>

      {/* Assets table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-slate-200">Holdings</h2>
        </div>
        {assets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Wallet size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No assets added yet</p>
            <Button onClick={openCreate} variant="secondary" size="sm" className="mt-4"><Plus size={14} /> Add Asset</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Asset', 'Type', 'Valuation', 'Invested', 'Return'].map((h) => (
                    <th scope="col" key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                  <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {assets.map((a) => {
                  const returnPct = a.investedAmount > 0 ? (((a.valuation - a.investedAmount) / a.investedAmount) * 100) : 0;
                  return (
                    <tr key={a._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-200">{a.name}</p>
                        {a.ticker && <p className="text-xs text-slate-500">{a.ticker}{a.quantity ? ` · ${a.quantity} shares` : ''}</p>}
                      </td>
                      <td className="px-5 py-3.5"><Badge color="slate">{a.assetType}</Badge></td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-200">{fmt(a.valuation, user?.currency)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{fmt(a.investedAmount, user?.currency)}</td>
                      <td className={`px-5 py-3.5 text-sm font-semibold ${returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmtPct(returnPct)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => openEdit(a)} 
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                            aria-label="Edit asset"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(a._id)} 
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            aria-label="Delete asset"
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAsset ? 'Edit Asset' : 'Add Asset'}>
        <div className="space-y-4">
          <Input label="Asset name" placeholder="e.g. S&P 500 ETF" value={form.name} onChange={set('name')} />
          <Select label="Asset type" value={form.assetType} onChange={set('assetType')}>
            {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Current valuation ($)" type="number" min="0" placeholder="0" value={form.valuation} onChange={set('valuation')} />
            <Input label="Amount invested ($)" type="number" min="0" placeholder="0" value={form.investedAmount} onChange={set('investedAmount')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ticker (optional)" placeholder="VOO" value={form.ticker} onChange={set('ticker')} />
            <Input label="Quantity (optional)" type="number" min="0" placeholder="10" value={form.quantity} onChange={set('quantity')} />
          </div>
          <Input label="Notes (optional)" placeholder="Any notes about this asset" value={form.notes} onChange={set('notes')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{editAsset ? 'Save Changes' : 'Add Asset'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
