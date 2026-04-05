import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex flex-col flex-1 min-h-screen transition-all duration-250 w-full ${sidebarCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar'}`}>
        <Header collapsed={sidebarCollapsed} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
