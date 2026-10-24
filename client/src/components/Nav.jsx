import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import StreakGauge from './StreakGauge';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/tracker',    label: 'Tracker'   },
  { to: '/habits',     label: 'Habits'    },
  { to: '/goals',      label: 'Goals'     },
  { to: '/analytics',  label: 'Analytics' },
  { to: '/admin',      label: 'Admin'     },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass strip */}
      <div
        className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 glass-strip"
      >
        {/* ── Wordmark ── */}
        <NavLink to="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--coral)' }}
          >
            W
          </span>
          <span className="font-bold text-base hidden sm:block" style={{ color: 'var(--ink)' }}>
            WealthHabit
          </span>
        </NavLink>

        {/* ── Desktop pill links ── */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Right cluster ── */}
        <div className="ml-auto flex items-center gap-3">
          {/* Streak gauge — persistent signature element */}
          {user && <StreakGauge streak={7} max={30} label="Streak" />}

          <ThemeToggle />

          {user && (
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 nav-pill text-sm"
              title={`Signed in as ${user.name}`}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'var(--coral)' }}
              >
                {user.name?.[0]?.toUpperCase()}
              </span>
              <span className="max-w-[80px] truncate" style={{ color: 'var(--muted)' }}>
                {user.name}
              </span>
              <span style={{ color: 'var(--rose)', fontSize: '0.7rem' }}>✕</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-border transition-colors"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="block w-5 h-0.5 mb-1 transition-all" style={{ background: 'var(--ink)' }} />
            <span className="block w-5 h-0.5 mb-1 transition-all" style={{ background: 'var(--ink)' }} />
            <span className="block w-5 h-0.5 transition-all" style={{ background: 'var(--ink)' }} />
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4 animate-fade-in"
          style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--border)' }}
        >
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `nav-pill text-left ${isActive ? 'active' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
            {user && (
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="nav-pill text-left mt-2"
                style={{ color: 'var(--rose)' }}
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
