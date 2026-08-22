import { useEffect, useState, useCallback } from 'react';
import {
  Users, BarChart3, MessageSquare, ShieldCheck, CheckCircle,
  Clock, AlertCircle, Search, Trash2, UserCheck, UserX,
  ShieldPlus, ShieldMinus, TrendingUp, Activity, Target, Flame,
  X, MoreVertical,
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Input';

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  open:        { label: 'Open',        icon: AlertCircle, cls: 'bg-red-50 text-red-600 border-red-200'    },
  in_progress: { label: 'In Progress', icon: Clock,       cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  resolved:    { label: 'Resolved',    icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

/* ─── Avatar initials ───────────────────────────────────────────── */
function Avatar({ name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const palette = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ];
  const color = palette[(name?.charCodeAt(0) || 0) % palette.length];
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <span className={`${sz} ${color} rounded-full flex items-center justify-center font-semibold shrink-0`}>
      {initials}
    </span>
  );
}

/* ─── Status pill ───────────────────────────────────────────────── */
function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

/* ─── Metric card ───────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, accent }) {
  const c = {
    violet:  { wrap: 'bg-violet-50 border-violet-100 text-violet-600',  val: 'text-violet-700'  },
    emerald: { wrap: 'bg-emerald-50 border-emerald-100 text-emerald-600', val: 'text-emerald-700' },
    blue:    { wrap: 'bg-blue-50 border-blue-100 text-blue-600',        val: 'text-blue-700'    },
    amber:   { wrap: 'bg-amber-50 border-amber-100 text-amber-600',     val: 'text-amber-700'   },
    red:     { wrap: 'bg-red-50 border-red-100 text-red-500',          val: 'text-red-600'     },
    cyan:    { wrap: 'bg-cyan-50 border-cyan-100 text-cyan-600',        val: 'text-cyan-700'    },
  }[accent] || {};

  return (
    <div className="card hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`w-8 h-8 flex items-center justify-center rounded-xl border ${c.wrap}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className={`text-2xl font-bold ${c.val}`}>{value ?? '—'}</p>
    </div>
  );
}

/* ─── User row action menu ──────────────────────────────────────── */
function UserActionMenu({ user, onToggleRole, onToggleActive, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="User actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-fade-in">
          <button
            onClick={() => { setOpen(false); onToggleRole(user); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {user.role === 'admin' ? <ShieldMinus size={13} /> : <ShieldPlus size={13} />}
            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
          </button>
          <button
            onClick={() => { setOpen(false); onToggleActive(user); }}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50
              ${user.isActive ? 'text-amber-600' : 'text-emerald-600'}`}
          >
            {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={() => { setOpen(false); onDelete(user); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={13} /> Delete User
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function Admin() {
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('metrics');
  const [search, setSearch] = useState('');
  const [fbModal, setFbModal] = useState(false);
  const [selectedFb, setSelectedFb] = useState(null);
  const [fbStatus, setFbStatus] = useState('open');
  const [fbNote, setFbNote] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Fetch all ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, uRes, fRes] = await Promise.all([
        adminAPI.getMetrics(),
        adminAPI.getUsers(),
        adminAPI.getFeedback(),
      ]);
      setMetrics(mRes.data.data);
      setUsers(uRes.data.data.users);
      setFeedback(fRes.data.data.feedback);
    } catch {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── User moderation ── */
  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUser(u._id, { role: newRole });
      toast.success(`${u.name} is now ${newRole}.`);
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, role: newRole } : x));
    } catch { toast.error('Update failed.'); }
  };

  const toggleActive = async (u) => {
    try {
      await adminAPI.updateUser(u._id, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}.`);
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
    } catch { toast.error('Update failed.'); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name} and ALL their data? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(u._id);
      toast.success(`${u.name} deleted.`);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch { toast.error('Delete failed.'); }
  };

  /* ── Feedback modal ── */
  const openFbModal = (fb) => {
    setSelectedFb(fb);
    setFbStatus(fb.status);
    setFbNote(fb.adminNote || '');
    setFbModal(true);
  };

  const handleFbUpdate = async () => {
    setSaving(true);
    try {
      await adminAPI.updateFeedback(selectedFb._id, { status: fbStatus, adminNote: fbNote });
      toast.success('Feedback updated.');
      setFbModal(false);
      fetchAll();
    } catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  };

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = feedback.filter((f) => f.status === 'open').length;

  /* ── Tabs config ── */
  const TABS = [
    { key: 'metrics',  label: 'Overview',  icon: BarChart3,     badge: null },
    { key: 'users',    label: 'Users',     icon: Users,         badge: users.length },
    { key: 'feedback', label: 'Feedback',  icon: MessageSquare, badge: openCount || null },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Loading admin data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-0.5">Platform management, moderation &amp; support.</p>
          </div>
        </div>
        {/* Quick status strip */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {users.filter((u) => u.isActive).length} active users
          </span>
          {openCount > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <AlertCircle size={12} /> {openCount} open ticket{openCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Segmented Tabs ── */}
      <div className="flex sm:inline-flex max-w-full overflow-x-auto no-scrollbar items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${tab === key
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon size={14} />
            {label}
            {badge != null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none
                ${tab === key
                  ? key === 'feedback' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                  : 'bg-slate-200 text-slate-500'}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ METRICS TAB ══════════════════════════════════════════════ */}
      {tab === 'metrics' && metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard icon={Users}       label="Total Users"       value={metrics.totalUsers}       accent="violet" />
            <MetricCard icon={TrendingUp}  label="New This Month"    value={metrics.newUsersThisMonth} accent="emerald" />
            <MetricCard icon={Activity}    label="Transactions"      value={metrics.totalTransactions} accent="blue" />
            <MetricCard icon={Flame}       label="Habits"            value={metrics.totalHabits}       accent="amber" />
            <MetricCard icon={Target}      label="Goals"             value={metrics.totalGoals}        accent="cyan" />
            <MetricCard icon={MessageSquare} label="Open Feedback"   value={metrics.openFeedback}      accent="red" />
          </div>

          {/* Health summary row */}
          <div className="card border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Platform snapshot</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Active Users',        value: users.filter((u) => u.isActive).length },
                { label: 'Admin Accounts',      value: users.filter((u) => u.role === 'admin').length },
                { label: 'Pending Feedback',    value: feedback.filter((f) => f.status !== 'resolved').length },
                { label: 'Resolved Feedback',   value: feedback.filter((f) => f.status === 'resolved').length },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xl font-bold text-slate-700">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ USERS TAB ════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search by name or email…"
              className="input-field pl-9 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg p-0.5"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Users size={32} className="text-slate-300" />
              <p className="text-sm text-slate-500">No users match "{search}"</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card p-0 overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        {['User', 'Role', 'Status', 'Joined'].map((h) => (
                          <th scope="col" key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="group hover:bg-slate-50/80 transition-colors">
                          {/* User col */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.name} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          {/* Role col */}
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border
                              ${u.role === 'admin'
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {u.role === 'admin' && <ShieldCheck size={10} />}
                              {u.role}
                            </span>
                          </td>
                          {/* Status col */}
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border
                              ${u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-600 border-red-200'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {/* Joined col */}
                          <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          {/* Actions col */}
                          <td className="px-4 py-3.5 text-right">
                            <UserActionMenu
                              user={u}
                              onToggleRole={toggleRole}
                              onToggleActive={toggleActive}
                              onDelete={deleteUser}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                  <p className="text-xs text-slate-400">
                    {filteredUsers.length} of {users.length} users
                  </p>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((u) => (
                  <div key={u._id} className="card flex items-start gap-3">
                    <Avatar name={u.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                        <UserActionMenu
                          user={u}
                          onToggleRole={toggleRole}
                          onToggleActive={toggleActive}
                          onDelete={deleteUser}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border
                          ${u.role === 'admin' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {u.role === 'admin' && <ShieldCheck size={10} />}{u.role}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border
                          ${u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ FEEDBACK TAB ═════════════════════════════════════════════ */}
      {tab === 'feedback' && (
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <MessageSquare size={24} className="text-slate-300" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">No feedback yet</p>
                <p className="text-sm text-slate-400 mt-1">User support tickets will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Status summary */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                  const count = feedback.filter((f) => f.status === key).length;
                  return (
                    <div key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${cfg.cls}`}>
                      <cfg.icon size={11} />{cfg.label}: <span className="font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>

              {feedback.map((fb) => {
                const cfg = STATUS_CFG[fb.status] || STATUS_CFG.open;
                const Icon = cfg.icon;
                return (
                  <div
                    key={fb._id}
                    className="card hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
                    onClick={() => openFbModal(fb)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Left: avatar */}
                      <Avatar name={fb.userId?.name || '?'} />
                      {/* Middle: content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <StatusPill status={fb.status} />
                          <span className="text-xs text-slate-400">
                            {fb.userId?.name || 'Unknown'} · {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{fb.subject}</p>
                        <p className="text-sm text-slate-500 truncate mt-0.5">{fb.message}</p>
                        {fb.adminNote && (
                          <p className="text-xs text-slate-400 mt-1 italic truncate">Note: {fb.adminNote}</p>
                        )}
                      </div>
                      {/* Right: action */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openFbModal(fb); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Feedback Review Modal ── */}
      <Modal isOpen={fbModal} onClose={() => setFbModal(false)} title="Review Feedback" size="sm">
        {selectedFb && (
          <div className="space-y-4">
            {/* Ticket details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar name={selectedFb.userId?.name} />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{selectedFb.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{selectedFb.userId?.email}</p>
                </div>
                <div className="ml-auto">
                  <StatusPill status={selectedFb.status} />
                </div>
              </div>
              <div className="h-px bg-slate-200" />
              <p className="text-sm font-semibold text-slate-800">{selectedFb.subject}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedFb.message}</p>
              <p className="text-xs text-slate-400">
                {new Date(selectedFb.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Status picker */}
            <Select label="Update status" value={fbStatus} onChange={(e) => setFbStatus(e.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </Select>

            {/* Admin note */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Admin note (internal)</label>
              <textarea
                className="input-field resize-none text-sm"
                rows={3}
                placeholder="Add an internal note or resolution summary…"
                value={fbNote}
                onChange={(e) => setFbNote(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setFbModal(false)} disabled={saving}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={handleFbUpdate} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
