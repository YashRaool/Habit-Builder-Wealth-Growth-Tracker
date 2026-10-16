import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, Target, TrendingUp,
  Flame, ShieldCheck, ChevronRight, DollarSign,
  LogOut, User, ChevronDown, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';
import ProfileModal from './ProfileModal';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/wealth', icon: TrendingUp, label: 'Wealth' },
  { to: '/feedback', icon: MessageSquare, label: 'Feedback' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-64 bg-white border-r border-slate-200/80
          flex flex-col transition-transform duration-300 ease-out shadow-card lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
            <DollarSign size={22} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight tracking-tight">FinHabit</p>
            <p className="text-2xs font-semibold text-emerald-700 tracking-wider uppercase mt-0.5">Wealth Growth OS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="pb-1 px-3">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Main Menu</span>
          </div>

          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="flex-1 tracking-tight">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-emerald-500 opacity-80 shrink-0" />}
                </>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-5 pb-1 px-3">
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Administration</span>
              </div>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                  ${
                    isActive
                      ? 'bg-violet-50 text-violet-800 font-semibold border border-violet-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ShieldCheck
                      size={18}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="flex-1 tracking-tight">Admin Console</span>
                    <Badge color="violet" size="sm">Admin</Badge>
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile Area */}
        <div className="p-3.5 border-t border-slate-100 relative bg-slate-50/40">
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-3 right-3 bottom-[calc(100%+8px)] z-20 bg-white border border-slate-200/90 rounded-2xl shadow-elevated p-1.5 animate-slide-up">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-2xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <User size={14} className="text-slate-400" /> Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors mt-0.5"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 text-left"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-100/90 border border-emerald-200/80 flex items-center justify-center shrink-0 text-emerald-800 font-bold text-sm shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate tracking-tight">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-2xs text-slate-500 capitalize">{user?.role || 'User'}</span>
              </div>
            </div>
            <ChevronDown
              size={15}
              className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </aside>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
