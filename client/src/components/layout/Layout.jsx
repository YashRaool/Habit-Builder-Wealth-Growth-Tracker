import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageContainer from './PageContainer';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto w-full">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
