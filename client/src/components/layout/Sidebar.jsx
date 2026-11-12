import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logoMark from '../../assets/logo-mark.png';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Flame,
  Target,
  TrendingUp,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Tracker', icon: ArrowLeftRight },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/wealth', label: 'Analytics', icon: TrendingUp },
];

export default function Sidebar({
  isCollapsed = false,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
  onOpenProfile,
}) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  const isRouteActive = (to) => {
    if (location.pathname === to) return true;
    if (to === '/transactions' && (location.pathname === '/transactions' || location.pathname === '/tracker')) return true;
    if (to === '/wealth' && (location.pathname === '/wealth' || location.pathname === '/analytics')) return true;
    return false;
  };

  const handleQuickAction = () => {
    navigate('/transactions?action=new');
    window.dispatchEvent(new CustomEvent('fht:quick-transaction'));
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Two-State Interactive Rail & Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 flex flex-col shrink-0
          transition-all duration-300 ease-in-out select-none
          md:static md:sticky md:top-0 md:h-screen md:z-30 md:translate-x-0 md:shadow-none
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-[68px] w-64' : 'md:w-64 w-64'}
        `}
      >
        {/* ── 1. Top Brand & Toggle Morph (Gemini UX) ── */}
        {isCollapsed ? (
          <div className="h-16 flex items-center justify-center shrink-0 border-b border-slate-200/80">
            <button
              type="button"
              onClick={onToggle}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-100 border border-slate-800/80 hover:border-slate-300 text-white hover:text-slate-700 font-bold flex items-center justify-center relative group cursor-pointer transition-colors duration-200 shadow-xs p-1"
              aria-label="Expand menu"
            >
              <img
                src={logoMark}
                alt="WealthHabit Logo"
                className="w-7 h-7 object-contain transition-all duration-200 group-hover:scale-0 group-hover:opacity-0 absolute"
              />
              <PanelLeftOpen
                size={20}
                className="transition-all duration-200 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 absolute text-slate-700"
              />
              <div className="absolute left-16 ml-2 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                Expand menu
              </div>
            </button>
          </div>
        ) : (
          <div className="h-16 px-4 flex items-center justify-between shrink-0 border-b border-slate-200/80">
            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center p-1 shadow-xs shrink-0 transition-transform group-hover:scale-105">
                <img
                  src={logoMark}
                  alt="WealthHabit Logo"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="truncate">
                <span className="text-[#0F172A] font-extrabold text-base tracking-tight block leading-tight">
                  Wealth<span className="text-[#4F46E5]">Habit</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Growth Loop
                </span>
              </div>
            </NavLink>
            <button
              type="button"
              onClick={onToggle}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer relative group"
              aria-label="Collapse menu"
            >
              <PanelLeftClose size={20} />
              <div className="absolute right-0 top-full mt-1.5 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                Collapse menu
              </div>
            </button>
          </div>
        )}

        {/* ── 2. Gemini-Style Quick Action Button ── */}
        {isCollapsed ? (
          <div className="p-3 shrink-0 flex justify-center">
            <button
              type="button"
              onClick={handleQuickAction}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-all cursor-pointer relative group shadow-2xs"
              aria-label="Quick Transaction"
            >
              <Plus size={20} />
              <div className="absolute left-16 ml-2 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                Quick Transaction
              </div>
            </button>
          </div>
        ) : (
          <div className="p-3 shrink-0">
            <button
              type="button"
              onClick={handleQuickAction}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-semibold rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs text-sm"
            >
              <Plus size={18} />
              <span>+ Quick Transaction</span>
            </button>
          </div>
        )}

        {/* ── 3. Navigation Items & Crisp Hover Tooltips ── */}
        <nav className="flex-1 px-3 py-1.5 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = isRouteActive(to);

            return (
              <NavLink
                key={to}
                to={to}
                onClick={onCloseMobile}
                className={
                  isCollapsed
                    ? `group relative w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 ${
                        active
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    : `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                }
              >
                <Icon
                  size={isCollapsed ? 20 : 19}
                  className={`shrink-0 transition-colors ${
                    active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{label}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-16 ml-2 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                    {label}
                  </div>
                )}
              </NavLink>
            );
          })}

          {/* Conditional Admin route */}
          {user?.role === 'admin' && (
            <>
              {!isCollapsed && (
                <div className="pt-3 pb-1 px-3.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    System
                  </p>
                </div>
              )}
              <NavLink
                to="/admin"
                onClick={onCloseMobile}
                className={
                  isCollapsed
                    ? `group relative w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 ${
                        location.pathname === '/admin'
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    : `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        location.pathname === '/admin'
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                }
              >
                <Shield
                  size={isCollapsed ? 20 : 19}
                  className={`shrink-0 transition-colors ${
                    location.pathname === '/admin'
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Admin</span>}

                {isCollapsed && (
                  <div className="absolute left-16 ml-2 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                    Admin
                  </div>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* ── 4. Bottom Sidebar Dock: Streak & User Profile ── */}
        {isCollapsed ? (
          <div className="p-3 border-t border-slate-200/80 flex flex-col items-center gap-3 shrink-0 bg-slate-50/50">
            {/* Streak Pill */}
            <div className="w-11 h-11 mx-auto rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200/70 relative group cursor-default">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <div className="absolute left-16 ml-2 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                7d Streak
              </div>
            </div>

            {/* Profile Avatar Trigger */}
            <div className="relative group flex justify-center">
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-indigo-500/30 transition-all"
                title={user?.name || 'User Profile'}
                aria-label="User Profile"
              >
                {user?.avatar || user?.picture ? (
                  <img
                    src={user.avatar || user.picture}
                    alt={user?.name || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center ring-2 ring-indigo-500/20">
                    {getInitials(user?.name)}
                  </div>
                )}
              </button>
              <div className="absolute left-16 ml-2 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                {user?.name || 'Profile'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-200/80 space-y-2 bg-slate-50/50 shrink-0">
            {/* Streak Summary */}
            <div className="bg-amber-50 text-amber-800 border border-amber-200/70 px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                <span>Habit Streak</span>
              </div>
              <span className="bg-amber-100/90 text-amber-900 px-1.5 py-0.5 rounded-md font-bold text-[11px]">
                7d
              </span>
            </div>

            {/* Interactive User Profile Trigger (Avatar + Name + Gear) */}
            <div
              onClick={onOpenProfile}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-2xs border border-transparent hover:border-slate-200/80 transition-all cursor-pointer group"
              title="Open Profile Settings"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-2.5 min-w-0">
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
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user?.email || (isAdmin ? 'Administrator' : 'Member')}
                  </p>
                </div>
              </div>
              <Settings
                size={16}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
