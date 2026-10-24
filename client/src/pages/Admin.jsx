import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import { useAuth } from '@/context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters & State
  const [searchUser, setSearchUser] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'open' | 'resolved'
  const [busyActionId, setBusyActionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Fetch Admin Data ── */
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsData, usersData, feedbackData] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=100'),
        api.get('/admin/feedback'),
      ]);

      setStats(statsData);
      setUsers(usersData.data || []);
      setFeedback(feedbackData || []);
      setAccessDenied(false);
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        setAccessDenied(true);
      } else {
        setErrorMsg('Failed to load admin dataset');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  /* ── Role Management ── */
  async function toggleUserRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setBusyActionId(`role-${u.id}`);
    try {
      const updated = await api.patch(`/admin/users/${u.id}/role`, { role: newRole });
      setUsers((prev) => prev.map((item) => (item.id === u.id ? updated : item)));
    } catch (err) {
      alert(err.errors?.[0] || err.error || 'Failed to update role');
    } finally {
      setBusyActionId(null);
    }
  }

  /* ── Delete User ── */
  async function deleteUser(u) {
    if (!window.confirm(`Are you sure you want to delete user ${u.name} (${u.email})?`)) return;
    setBusyActionId(`del-${u.id}`);
    try {
      await api.del(`/admin/users/${u.id}`);
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      if (stats) setStats((prev) => ({ ...prev, user_count: Math.max(0, prev.user_count - 1) }));
    } catch (err) {
      alert(err.error || 'Failed to delete user');
    } finally {
      setBusyActionId(null);
    }
  }

  /* ── Toggle Feedback Status ── */
  async function toggleFeedbackStatus(fb) {
    const newStatus = fb.status === 'open' ? 'resolved' : 'open';
    setBusyActionId(`fb-${fb.id}`);
    try {
      const updated = await api.patch(`/admin/feedback/${fb.id}`, { status: newStatus });
      setFeedback((prev) => prev.map((item) => (item.id === fb.id ? updated : item)));
      if (stats) {
        setStats((prev) => ({
          ...prev,
          feedback_open: newStatus === 'resolved' ? Math.max(0, prev.feedback_open - 1) : prev.feedback_open + 1,
        }));
      }
    } catch (err) {
      alert(err.errors?.[0] || 'Failed to update feedback status');
    } finally {
      setBusyActionId(null);
    }
  }

  /* ── Filtered Users & Feedback ── */
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredFeedback = feedback.filter((f) => {
    if (feedbackFilter === 'open') return f.status === 'open';
    if (feedbackFilter === 'resolved') return f.status === 'resolved';
    return true;
  });

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Card padding="p-8">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--rose)' }}>
            Access Restricted
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            You must have an administrator account to view the Admin Panel.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              Admin Panel
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(242,121,61,0.15)', color: 'var(--coral)' }}
            >
              Role: {user?.role || 'admin'}
            </span>
          </div>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
            System aggregate KPIs, platform usage stats, user management, and feedback inbox
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Loading system metrics…
        </div>
      ) : errorMsg ? (
        <Card padding="p-6">
          <p className="text-xs" style={{ color: 'var(--rose)' }}>
            {errorMsg}
          </p>
        </Card>
      ) : (
        <>
          {/* ── Aggregate KPIs Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="p-5">
              <Card.Label>Platform Users</Card.Label>
              <Card.Stat className="text-2xl">{stats?.user_count || 0}</Card.Stat>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                Active users: <strong style={{ color: 'var(--mint)' }}>{stats?.active_users || 0}</strong>
              </p>
            </Card>

            <Card padding="p-5">
              <Card.Label>Habit Completion Rate</Card.Label>
              <Card.Stat className="text-2xl" style={{ color: 'var(--mint)' }}>
                {stats?.habit_completion_rate || 0}%
              </Card.Stat>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                Across {stats?.total_habit_logs || 0} logged check-ins
              </p>
            </Card>

            <Card padding="p-5">
              <Card.Label>Average Goal Progress</Card.Label>
              <Card.Stat className="text-2xl" style={{ color: 'var(--coral)' }}>
                {stats?.avg_goal_completion || 0}%
              </Card.Stat>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                Across {stats?.goal_count || 0} savings goals
              </p>
            </Card>

            <Card padding="p-5">
              <Card.Label>Feedback Inbox</Card.Label>
              <Card.Stat className="text-2xl" style={{ color: stats?.feedback_open > 0 ? 'var(--rose)' : 'var(--ink)' }}>
                {stats?.feedback_open || 0} Open
              </Card.Stat>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                {stats?.feedback_total || 0} total submission(s)
              </p>
            </Card>
          </div>

          {/* ── Platform Usage Stats Bar ── */}
          <Card padding="p-5" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold block" style={{ color: 'var(--muted)' }}>
                Total Platform Inflows Logged
              </span>
              <strong className="text-lg" style={{ color: 'var(--mint)' }}>
                {fmt(stats?.total_income)}
              </strong>
            </div>
            <div className="w-px h-8 hidden sm:block" style={{ background: 'var(--border)' }} />
            <div>
              <span className="text-xs font-semibold block" style={{ color: 'var(--muted)' }}>
                Total Platform Outflows Logged
              </span>
              <strong className="text-lg" style={{ color: 'var(--rose)' }}>
                {fmt(stats?.total_expenses)}
              </strong>
            </div>
            <div className="w-px h-8 hidden sm:block" style={{ background: 'var(--border)' }} />
            <div>
              <span className="text-xs font-semibold block" style={{ color: 'var(--muted)' }}>
                Total Active Habits Tracked
              </span>
              <strong className="text-lg" style={{ color: 'var(--ink)' }}>
                {stats?.habit_count || 0} habits
              </strong>
            </div>
          </Card>

          {/* ── Section 1: User Management ── */}
          <Card padding="p-6" className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
                  User Management
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Manage platform users, roles, and administrative privileges
                </p>
              </div>

              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full sm:w-64 rounded-xl px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--canvas)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--muted)' }}>
                    <th className="py-2.5 px-3 font-semibold">User</th>
                    <th className="py-2.5 px-3 font-semibold">Role</th>
                    <th className="py-2.5 px-3 font-semibold">Joined</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
                        No users found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === user?.id;
                      const isRoleBusy = busyActionId === `role-${u.id}`;
                      const isDelBusy = busyActionId === `del-${u.id}`;

                      return (
                        <tr
                          key={u.id}
                          className="transition-colors hover:bg-[var(--canvas)]"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold" style={{ color: 'var(--ink)' }}>
                              {u.name} {isSelf && <span className="text-[10px] text-muted">(You)</span>}
                            </div>
                            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                              {u.email}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className="px-2 py-0.5 rounded-md font-semibold text-[11px]"
                              style={{
                                background: u.role === 'admin' ? 'rgba(242,121,61,0.12)' : 'var(--canvas)',
                                color: u.role === 'admin' ? 'var(--coral)' : 'var(--muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-3" style={{ color: 'var(--muted)' }}>
                            {fmtDate(u.created_at)}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleUserRole(u)}
                                disabled={isRoleBusy || isSelf}
                                className="px-2.5 py-1 rounded-lg font-semibold transition-all active:scale-95 text-[11px]"
                                style={{
                                  background: 'var(--canvas)',
                                  border: '1px solid var(--border)',
                                  color: isSelf ? 'var(--muted)' : 'var(--ink)',
                                }}
                              >
                                {isRoleBusy ? 'Updating…' : u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>

                              {!isSelf && (
                                <button
                                  onClick={() => deleteUser(u)}
                                  disabled={isDelBusy}
                                  className="px-2.5 py-1 rounded-lg font-semibold transition-all active:scale-95 text-[11px]"
                                  style={{
                                    background: 'rgba(226,87,76,0.1)',
                                    color: 'var(--rose)',
                                    border: '1px solid rgba(226,87,76,0.2)',
                                  }}
                                >
                                  {isDelBusy ? 'Deleting…' : 'Delete'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Section 2: Feedback & Complaints Inbox ── */}
          <Card padding="p-6" className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
                  Feedback & Complaints Inbox
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Review user issues, feature requests, and feedback items
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--canvas)', border: '1.5px solid var(--border)' }}>
                {['all', 'open', 'resolved'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFeedbackFilter(tab)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{
                      background: feedbackFilter === tab ? 'var(--coral)' : 'transparent',
                      color: feedbackFilter === tab ? '#fff' : 'var(--muted)',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {filteredFeedback.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: 'var(--muted)' }}>
                No feedback items found in {feedbackFilter} status.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFeedback.map((fb) => {
                  const isOpen = fb.status === 'open';
                  const isBusy = busyActionId === `fb-${fb.id}`;

                  return (
                    <div
                      key={fb.id}
                      className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                      style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase"
                            style={{
                              background: isOpen ? 'rgba(226,87,76,0.12)' : 'rgba(47,168,108,0.12)',
                              color: isOpen ? 'var(--rose)' : 'var(--mint)',
                            }}
                          >
                            {fb.status}
                          </span>
                          <span className="font-semibold text-xs" style={{ color: 'var(--ink)' }}>
                            {fb.user_name || 'Anonymous User'}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                            ({fb.user_email || 'No email'}) • {fmtDate(fb.created_at)}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--ink)', lineHeight: '1.4' }}>
                          "{fb.message}"
                        </p>
                      </div>

                      <button
                        onClick={() => toggleFeedbackStatus(fb)}
                        disabled={isBusy}
                        className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0"
                        style={{
                          background: isOpen ? 'var(--mint)' : 'var(--surface)',
                          color: isOpen ? '#fff' : 'var(--ink)',
                          border: isOpen ? 'none' : '1.5px solid var(--border)',
                        }}
                      >
                        {isBusy ? 'Processing…' : isOpen ? '✓ Mark Resolved' : 'Reopen Issue'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
