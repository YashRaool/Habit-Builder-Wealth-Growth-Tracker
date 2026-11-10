import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageContainer from './PageContainer';
import ProfileDrawer from './ProfileDrawer';

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('fht_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile sidebar whenever route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Global listener for opening profile drawer
  useEffect(() => {
    const handleOpen = () => setIsProfileOpen(true);
    window.addEventListener('fht:open-profile', handleOpen);
    return () => window.removeEventListener('fht:open-profile', handleOpen);
  }, []);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('fht_sidebar_collapsed', String(next));
        } catch {
          // ignore storage error
        }
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Collapsible Left Sidebar ── */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* ── Main Content Column (Slim Header + Canvas) ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* ── Main Content Canvas: smooth resizing without horizontal scrollbars ── */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-6 lg:p-8">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>

      {/* ── Slide-Over Profile Drawer ── */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
