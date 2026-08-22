import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, Target, TrendingUp,
  Flame, ShieldCheck, ChevronRight, DollarSign,
  LogOut, User, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/wealth', icon: TrendingUp, label: 'Wealth' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-64 bg-white border-r border-slate-200
        flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <DollarSign size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">FinHabit</p>
            <p className="text-xs text-slate-500 font-medium">Wealth Tracker</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="opacity-60" />}
                </>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-6 pb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">Admin</p>
              </div>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ShieldCheck size={18} className={isActive ? 'text-violet-600' : 'text-slate-400'} />
                    <span>Admin Panel</span>
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-slate-100 relative">
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-4 right-4 bottom-[calc(100%+8px)] z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-1 animate-slide-up">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); onClose?.(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <User size={15} /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 text-left"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-emerald-700 font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{isAdmin ? 'Administrator' : 'User'}</p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
