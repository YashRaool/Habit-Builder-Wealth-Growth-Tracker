import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Flame, UserCog, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROUTE_META = {
  '/dashboard': { title: 'Dashboard', section: 'Overview' },
  '/transactions': { title: 'Transactions & Tracker', section: 'Cash Flow' },
  '/tracker': { title: 'Transactions & Tracker', section: 'Cash Flow' },
  '/habits': { title: 'Habits & Streaks', section: 'Routines' },
  '/goals': { title: 'Financial Goals', section: 'Milestones' },
  '/wealth': { title: 'Wealth & Analytics', section: 'Portfolio' },
  '/analytics': { title: 'Wealth & Analytics', section: 'Portfolio' },
  '/admin': { title: 'Admin Console', section: 'Management' },
};

export default function Navbar({
  isSidebarCollapsed = false,
  onToggleSidebar,
  onOpenProfile,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const currentMeta = ROUTE_META[location.pathname] || {
    title: 'WealthHabit',
    section: 'App',
  };

  return (
    <header className="h-16 sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between">
      {/* ── Left Side: Mobile Hamburger Trigger + Dynamic Page Title ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden -ml-2 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 min-w-0 text-sm">
          <span className="text-slate-400 font-medium hidden sm:inline truncate">
            {currentMeta.section}
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <h1 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg truncate">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* ── Right Side: Streak Badge + Profile Trigger + Logout ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Compact Streak Pill Badge */}
        <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
          <Flame size={13} className="text-amber-500 fill-amber-500" />
          <span>7d Streak</span>
        </div>

        {/* Interactive User Profile Trigger Pill */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer group"
          title="Open Profile Settings"
          aria-label="Open Profile Settings"
        >
          {user?.avatar || user?.picture ? (
            <img
              src={user.avatar || user.picture}
              alt={user?.name || 'User'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-indigo-500/20">
              {getInitials(user?.name)}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[120px] truncate">
            {user?.name || 'Account'}
          </span>
          <UserCog
            size={15}
            className="text-slate-400 group-hover:text-indigo-600 transition-colors hidden sm:inline"
          />
        </button>

        {/* Clean Logout Icon Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
