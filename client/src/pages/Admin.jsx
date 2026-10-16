import { useEffect, useState, useCallback } from 'react';
import {
  Users, BarChart3, MessageSquare, ShieldCheck, CheckCircle,
  Clock, AlertCircle, Search, Trash2, UserCheck, UserX,
  ShieldPlus, ShieldMinus, TrendingUp, Activity, Target, Flame,
  X, MoreVertical,
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { useToast } from '../context/ToastContext';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select, Textarea } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/layout/PageHeader';
import { StatCardSkeleton, TableSkeleton } from '../components/ui/Skeleton';

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  open: { label: 'Open', color: 'rose', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'amber', icon: Clock },
  resolved: { label: 'Resolved', color: 'emerald', icon: CheckCircle },
};

/* ─── Avatar initials ───────────────────────────────────────────── */
function Avatar({ name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const palette = [
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
  ];
  const color = palette[(name?.charCodeAt(0) || 0) % palette.length];
  const sz = size === 'lg' ? 'w-10 h-10 text-xs' : 'w-8 h-8 text-2xs';
  return (
    <span className={`${sz} ${color} rounded-xl border flex items-center justify-center font-bold shrink-0 shadow-xs`}>
      {initials}
    </span>
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
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        aria-label="User actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-elevated py-1 animate-fade-in">
          <button
            onClick={() => { setOpen(false); onToggleRole(user); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {user.role === 'admin' ? <ShieldMinus size={13} className="text-slate-400" /> : <ShieldPlus size={13} className="text-violet-600" />}
            {user.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
          </button>
          <button
            onClick={() => { setOpen(false); onToggleActive(user); }}
            className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors
              ${user.isActive ? 'text-amber-600' : 'text-emerald-600'}`}
          >
            {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={() => { setOpen(false); onDelete(user); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} /> Delete Account
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
      toast.error('Failed to load admin telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUser(u._id, { role: newRole });
      toast.success(`${u.name} role changed to ${newRole}.`);
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, role: newRole } : x));
    } catch {
      toast.error('Role update failed.');
    }
  };

  const toggleActive = async (u) => {
    try {
      await adminAPI.updateUser(u._id, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}.`);
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
    } catch {
      toast.error('Status update failed.');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Permanently delete account "${u.name}" and all associated financial records?`)) return;
    try {
      await adminAPI.deleteUser(u._id);
      toast.success(`Account for ${u.name} deleted.`);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch {
      toast.error('Deletion failed.');
    }
  };

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
      toast.success('Feedback ticket resolved.');
      setFbModal(false);
      fetchAll();
    } catch {
      toast.error('Failed to update ticket.');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = feedback.filter((f) => f.status === 'open').length;

  const TABS = [
    { key: 'metrics', label: 'Platform Telemetry', icon: BarChart3, badge: null },
    { key: 'users', label: 'User Directory', icon: Users, badge: users.length },
    { key: 'feedback', label: 'Support Queue', icon: MessageSquare, badge: openCount || null },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Admin Console" description="Platform moderation, user management, and support telemetry." />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Admin Console"
        description="Enterprise platform telemetry, user management, and customer support queues."
      >
        <div className="flex items-center gap-2">
          <Badge color="violet" size="md">
            <ShieldCheck size={13} /> Administrator Level
          </Badge>
          {openCount > 0 && (
            <Badge color="rose" size="md">
              <AlertCircle size={13} /> {openCount} Pending Ticket{openCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </PageHeader>

      {/* Segmented Navigation Tabs */}
      <div className="inline-flex max-w-full overflow-x-auto no-scrollbar items-center gap-1 bg-slate-100 border border-slate-200/90 p-1 rounded-xl">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
              ${
                tab === key
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Icon size={14} className={tab === key ? 'text-emerald-600' : 'text-slate-400'} />
            {label}
            {badge != null && (
              <span
                className={`text-2xs font-bold px-1.5 py-0.5 rounded-full tabular-nums leading-none
                ${
                  tab === key
                    ? key === 'feedback'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                    : 'bg-slate-200/70 text-slate-500'
                }`}
              >
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
            <StatCard
              icon={Users}
              label="Total Accounts"
              value={<span className="tabular-nums">{metrics.totalUsers}</span>}
              color="violet"
            />
            <StatCard
              icon={TrendingUp}
              label="New This Month"
              value={<span className="tabular-nums">{metrics.newUsersThisMonth}</span>}
              color="emerald"
            />
            <StatCard
              icon={Activity}
              label="Transactions"
              value={<span className="tabular-nums">{metrics.totalTransactions}</span>}
              color="blue"
            />
            <StatCard
              icon={Flame}
              label="Active Habits"
              value={<span className="tabular-nums">{metrics.totalHabits}</span>}
              color="amber"
            />
            <StatCard
              icon={Target}
              label="Capital Goals"
              value={<span className="tabular-nums">{metrics.totalGoals}</span>}
              color="cyan"
            />
            <StatCard
              icon={MessageSquare}
              label="Support Tickets"
              value={<span className="tabular-nums">{metrics.openFeedback}</span>}
              color={metrics.openFeedback > 0 ? 'red' : 'emerald'}
            />
          </div>

          {/* Platform Snapshot Card */}
          <Card className="p-5 sm:p-6">
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Database Platform Audit</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Active Active Users', value: users.filter((u) => u.isActive).length },
                { label: 'System Admin Roles', value: users.filter((u) => u.role === 'admin').length },
                { label: 'Pending Feedback', value: feedback.filter((f) => f.status !== 'resolved').length },
                { label: 'Resolved Tickets', value: feedback.filter((f) => f.status === 'resolved').length },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
                  <p className="text-2xs font-medium text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══ USERS TAB ════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="max-w-md">
            <Input
              id="admin-search-users"
              placeholder="Search directory by name or email…"
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              rightElement={
                search ? (
                  <button
                    onClick={() => setSearch('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : null
              }
            />
          </div>

          {filteredUsers.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Users size={32} className="text-slate-300" />
              <p className="text-sm text-slate-600 font-medium">No user accounts found matching "{search}"</p>
              <Button size="sm" variant="secondary" onClick={() => setSearch('')}>Clear Search Filter</Button>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">User Identity</th>
                      <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Access Role</th>
                      <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="text-left px-5 py-3 text-2xs font-semibold text-slate-500 uppercase tracking-wider">Registration Date</th>
                      <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">{u.name}</p>
                              <p className="text-2xs text-slate-400 font-mono truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge color={u.role === 'admin' ? 'violet' : 'slate'} size="sm" variant="rounded">
                            {u.role === 'admin' && <ShieldCheck size={11} />}
                            <span className="capitalize">{u.role}</span>
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge color={u.isActive ? 'emerald' : 'rose'} size="sm">
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
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
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex justify-between items-center text-2xs text-slate-400">
                <span>Displaying <span className="font-semibold text-slate-700 tabular-nums">{filteredUsers.length}</span> user accounts</span>
                <span className="tabular-nums font-medium text-slate-600">Total Directory: {users.length}</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══ FEEDBACK TAB ═════════════════════════════════════════════ */}
      {tab === 'feedback' && (
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <MessageSquare size={24} className="text-slate-300" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">No support tickets in queue</p>
                <p className="text-xs text-slate-400 mt-0.5">User inquiries and app suggestions will be routed here.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Status summary pill strip */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                  const count = feedback.filter((f) => f.status === key).length;
                  return (
                    <Badge key={key} color={cfg.color} size="md">
                      <cfg.icon size={12} />
                      {cfg.label}: <span className="font-bold tabular-nums ml-0.5">{count}</span>
                    </Badge>
                  );
                })}
              </div>

              {feedback.map((fb) => {
                const cfg = STATUS_CFG[fb.status] || STATUS_CFG.open;
                return (
                  <Card
                    key={fb._id}
                    className="p-4 sm:p-5 hover:border-slate-300 hover:shadow-card transition-all cursor-pointer"
                    onClick={() => openFbModal(fb)}
                  >
                    <div className="flex items-start gap-3.5">
                      <Avatar name={fb.userId?.name || '?'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Badge color={cfg.color} size="sm">
                            <cfg.icon size={11} /> {cfg.label}
                          </Badge>
                          <span className="text-2xs text-slate-400 tabular-nums">
                            {fb.userId?.name || 'Unknown User'} · {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{fb.subject}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">{fb.message}</p>
                        {fb.adminNote && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-2xs text-slate-600 font-medium">
                            <span className="font-semibold text-slate-800">Admin Resolution Note:</span> {fb.adminNote}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFbModal(fb);
                        }}
                        className="shrink-0 text-xs"
                      >
                        Review
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Feedback Review Modal ── */}
      <Modal isOpen={fbModal} onClose={() => setFbModal(false)} title="Support Ticket Resolution" size="sm">
        {selectedFb && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={selectedFb.userId?.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{selectedFb.userId?.name || 'Unknown'}</p>
                  <p className="text-2xs text-slate-400 font-mono truncate">{selectedFb.userId?.email}</p>
                </div>
                <Badge color={STATUS_CFG[selectedFb.status]?.color || 'rose'} size="sm">
                  {STATUS_CFG[selectedFb.status]?.label || selectedFb.status}
                </Badge>
              </div>
              <div className="h-px bg-slate-200" />
              <p className="text-xs font-semibold text-slate-900">{selectedFb.subject}</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">{selectedFb.message}</p>
            </div>

            <Select
              label="Ticket Resolution Status"
              value={fbStatus}
              onChange={(e) => setFbStatus(e.target.value)}
              disabled={saving}
            >
              <option value="open">Open (Awaiting triage)</option>
              <option value="in_progress">In Progress (Investigating)</option>
              <option value="resolved">Resolved (Closed)</option>
            </Select>

            <Textarea
              label="Internal Admin Notes"
              rows={3}
              placeholder="Record investigative steps or resolution summary…"
              value={fbNote}
              onChange={(e) => setFbNote(e.target.value)}
              disabled={saving}
            />

            <div className="flex gap-2.5 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setFbModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button className="flex-1" loading={saving} onClick={handleFbUpdate} disabled={saving}>
                {saving ? 'Updating...' : 'Save Ticket Status'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
