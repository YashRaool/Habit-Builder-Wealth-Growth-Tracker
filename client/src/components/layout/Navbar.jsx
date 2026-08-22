import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  
  // Format the path into a readable title (e.g., /transactions -> Transactions)
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-20 lg:hidden">
      <button
        onClick={onMenuToggle}
        className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
      
      <p className="font-semibold text-slate-900 text-lg">{getPageTitle()}</p>
    </header>
  );
}
