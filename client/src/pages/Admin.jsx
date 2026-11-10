import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users, BarChart3, MessageSquare, ShieldCheck, CheckCircle,
  Clock, AlertCircle, Search, Trash2, UserCheck, UserX,
  ShieldPlus, ShieldMinus, TrendingUp, Activity, Target, Flame,
  X, MoreVertical, Loader2, Sparkles, Star
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Input';

/* ─── Status Config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  open: { label: 'Open', icon: AlertCircle, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  in_progress: { label: 'In Progress', icon: Clock, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'Resolved', icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

/* ─── Avatar Initials ───────────────────────────────────────────── */
function Avatar({ name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const palette = [
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-rose-50 text-rose-700 border-rose-200',
    'bg-slate-100 text-slate-700 border-slate-200',
  ];
  const color = palette[(name?.charCodeAt(0) || 0) % palette.length];
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <span className={`${sz} ${color} border rounded-full flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </span>
  );
}

/* ─── Status Pill ───────────────────────────────────────────────── */
function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <Icon size={12} />
      <span>{cfg.label}</span>
    </span>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`w-9 h-9 flex items-center justify-center rounded-xl border ${iconBg} ${iconColor} shrink-0`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── User Action Menu ─────────────────────────────────────────── */
function UserActionMenu({ user, onToggleRole, onToggleActive, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="User actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200/90 rounded-xl shadow-lg py-1 animate-fade-in">
          <button
            type="button"
            onClick={() => { setOpen(false); onToggleRole(user); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {user.role === 'admin' ? <ShieldMinus size={14} /> : <ShieldPlus size={14} />}
            {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onToggleActive(user); }}
            className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-slate-50 cursor-pointer ${
              user.isActive ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
            {user.isActive ? 'Deactivate User' : 'Activate User'}
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(user); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 size={14} /> Delete User
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Admin Component ─────────────────────────────────────── */
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  /* ── Fetch all telemetry & data ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, uRes, fRes] = await Promise.all([
        adminAPI.getMetrics(),
        adminAPI.getUsers(),
        adminAPI.getFeedback(),
      ]);
      setMetrics(mRes.data.data);
      setUsers(uRes.data.data.users || []);
      setFeedback(fRes.data.data.feedback || []);
    } catch {
      toast.error('Failed to load admin telemetry data.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── Role & Active Toggles ── */
  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUser(u._id, { role: newRole });
      toast.success(`${u.name} is now ${newRole}.`);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: newRole } : x)));
    } catch {
      toast.error('Role update failed.');
    }
  };

  const toggleActive = async (u) => {
    try {
      await adminAPI.updateUser(u._id, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}.`);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: !x.isActive } : x)));
    } catch {
      toast.error('Status update failed.');
    }
  };

  /* ── Delete User ── */
  const promptDeleteUser = (u) => {
    setUserToDelete(u);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminAPI.deleteUser(userToDelete._id);
      toast.success(`${userToDelete.name} deleted.`);
      setUsers((prev) => prev.filter((x) => x._id !== userToDelete._id));
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  /* ── Feedback Review ── */
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
      toast.success('Feedback status updated.');
      setFbModal(false);
      fetchAll();
    } catch {
      toast.error('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const openCount = feedback.filter((f) => f.status === 'open').length;
  const activeUsersCount = users.filter((u) => u.isActive).length;

  const TABS = [
    { key: 'metrics', label: 'Overview', icon: BarChart3, badge: null },
    { key: 'users', label: 'Users', icon: Users, badge: users.length },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare, badge: openCount || null },
  ];

  /* ── Skeleton Loading ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-32 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-28 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Top Header Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-indigo-600" />
              System Control
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Platform governance, user accounts moderation, and feedback telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2">
            <span className="font-semibold text-slate-900">{activeUsersCount}</span> active of {users.length} total
          </div>
          {openCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-xl px-3 py-2 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-rose-600" />
              <span>{openCount} Open Ticket{openCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Top KPI Grid (grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <KpiCard
          icon={Users}
          label="Total Users"
          value={metrics?.totalUsers ?? users.length}
          sub={`+${metrics?.newUsersThisMonth ?? 0} this month`}
          iconBg="bg-indigo-50 border-indigo-100"
          iconColor="text-indigo-600"
        />
        <KpiCard
          icon={Flame}
          label="Active Habits"
          value={metrics?.totalHabits ?? 0}
          sub="Platform routines tracked"
          iconBg="bg-amber-50 border-amber-100"
          iconColor="text-amber-600"
        />
        <KpiCard
          icon={Activity}
          label="Total Transactions"
          value={metrics?.totalTransactions ?? 0}
          sub="Income & expenses recorded"
          iconBg="bg-emerald-50 border-emerald-100"
          iconColor="text-emerald-600"
        />
        <KpiCard
          icon={Target}
          label="Goals & Feedback"
          value={`${metrics?.totalGoals ?? 0} Goals`}
          sub={`${metrics?.openFeedback ?? openCount} open tickets`}
          iconBg="bg-sky-50 border-sky-100"
          iconColor="text-sky-600"
        />
      </div>

      {/* ── 3. Segmented Tab Navigation ── */}
      <div className="flex sm:inline-flex max-w-full overflow-x-auto items-center gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-xl">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              tab === key
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
            {badge != null && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none ${
                  tab === key
                    ? key === 'feedback'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══════════════════════════════════════════════ */}
      {tab === 'metrics' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Platform Health & System Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-slate-100">
              <div className="first:pl-0 pl-4">
                <p className="text-3xl font-bold text-slate-900">{activeUsersCount}</p>
                <p className="text-xs text-slate-500 mt-1">Active Accounts</p>
              </div>
              <div className="pl-4">
                <p className="text-3xl font-bold text-indigo-600">
                  {users.filter((u) => u.role === 'admin').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Admin Operators</p>
              </div>
              <div className="pl-4">
                <p className="text-3xl font-bold text-amber-600">
                  {feedback.filter((f) => f.status !== 'resolved').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pending Support</p>
              </div>
              <div className="pl-4">
                <p className="text-3xl font-bold text-emerald-600">
                  {feedback.filter((f) => f.status === 'resolved').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Resolved Tickets</p>
              </div>
            </div>
          </div>

          {/* Telemetry Bento Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Security & Role Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Standard Users</span>
                  <span className="font-semibold text-slate-900">
                    {users.filter((u) => u.role !== 'admin').length} accounts
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{
                      width: `${users.length > 0 ? (users.filter((u) => u.role !== 'admin').length / users.length) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-600">Administrative Privileges</span>
                  <span className="font-semibold text-indigo-600">
                    {users.filter((u) => u.role === 'admin').length} accounts
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{
                      width: `${users.length > 0 ? (users.filter((u) => u.role === 'admin').length / users.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Feedback Resolution Rate</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Resolved Tickets</span>
                  <span className="font-semibold text-emerald-600">
                    {feedback.length > 0
                      ? Math.round((feedback.filter((f) => f.status === 'resolved').length / feedback.length) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${feedback.length > 0 ? (feedback.filter((f) => f.status === 'resolved').length / feedback.length) * 100 : 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total tickets processed: {feedback.length} submissions across all users.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ USERS TAB: User Roster Table ══════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search user by name or email…"
              className="input-field pl-9 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none rounded-lg p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No users match "{search}"</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th scope="col" className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.role === 'admin' ? (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                              <ShieldCheck size={11} /> ADMIN
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              USER
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap font-medium">
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <UserActionMenu
                            user={u}
                            onToggleRole={toggleRole}
                            onToggleActive={toggleActive}
                            onDelete={promptDeleteUser}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
                <span>Showing {filteredUsers.length} of {users.length} registered accounts</span>
                <span className="font-medium text-slate-700">Governance Policy Active</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ FEEDBACK TAB: Feedback Management Section ════════════════ */}
      {tab === 'feedback' && (
        <div className="space-y-4">
          {/* Status summary filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(STATUS_CFG).map(([key, cfg]) => {
              const count = feedback.filter((f) => f.status === key).length;
              return (
                <div
                  key={key}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${cfg.cls}`}
                >
                  <cfg.icon size={12} />
                  <span>{cfg.label}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          {feedback.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
              <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No feedback tickets logged</p>
              <p className="text-sm text-slate-400 mt-1">Platform user inquiries will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((fb) => (
                <div
                  key={fb._id}
                  onClick={() => openFbModal(fb)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-start gap-4"
                >
                  <Avatar name={fb.userId?.name || '?'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusPill status={fb.status} />
                      <span className="text-xs text-slate-400 font-medium">
                        {fb.userId?.name || 'Anonymous User'} ·{' '}
                        {new Date(fb.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{fb.subject}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{fb.message}</p>
                    {fb.adminNote && (
                      <p className="text-xs text-slate-400 mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2 italic">
                        Internal note: {fb.adminNote}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFbModal(fb);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Feedback Review Modal (fixed inset-0 z-50 centered) ── */}
      <Modal
        isOpen={fbModal}
        onClose={() => setFbModal(false)}
        title="Review Feedback Ticket"
        size="sm"
      >
        {selectedFb && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar name={selectedFb.userId?.name} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedFb.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{selectedFb.userId?.email}</p>
                </div>
                <div className="ml-auto">
                  <StatusPill status={selectedFb.status} />
                </div>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <p className="text-sm font-bold text-slate-900">{selectedFb.subject}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedFb.message}</p>
              <p className="text-xs text-slate-400 pt-1">
                Submitted on{' '}
                {new Date(selectedFb.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <Select
              label="Update status"
              value={fbStatus}
              onChange={(e) => setFbStatus(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </Select>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Admin note (internal)</label>
              <textarea
                className="input-field resize-none text-sm"
                rows={3}
                placeholder="Add resolution details or escalation notes…"
                value={fbNote}
                onChange={(e) => setFbNote(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFbModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFbUpdate}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 font-semibold text-sm shadow-xs transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Saving…</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete User Confirmation Modal (fixed inset-0 z-50 centered) ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        title="Delete User Account?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Permanently delete <span className="font-bold text-slate-900">{userToDelete?.name}</span> ({userToDelete?.email}) and all their associated financial habits, goals, and transaction records? This action cannot be reversed.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setUserToDelete(null);
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteUser}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs cursor-pointer"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
