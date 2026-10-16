import { Menu, TrendingUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const { user } = useAuth();
  
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 flex items-center justify-between px-4 sticky top-0 z-20 lg:hidden shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600">
            <TrendingUp size={16} />
          </div>
          <span className="font-bold text-slate-900 text-base">{getPageTitle()}</span>
        </div>
      </div>

      {user && (
        <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800">
          {user.name?.charAt(0).toUpperCase()}
        </div>
      )}
    </header>
  );
}
