import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen text-gray-800 font-sans">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`flex flex-col flex-1 min-h-screen transition-all duration-300 w-full ${sidebarCollapsed ? 'md:pl-sidebar-collapsed' : 'md:pl-sidebar'}`}>
        <Header
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden w-full max-w-full animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
