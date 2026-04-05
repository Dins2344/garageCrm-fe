import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineCog,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineLogout
} from 'react-icons/hi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid, roles: ['owner', 'admin', 'service_advisor', 'mechanic', 'receptionist'] },
  { path: '/jobcards', label: 'Job Cards', icon: HiOutlineClipboardList, roles: ['owner', 'admin', 'service_advisor', 'mechanic'] },
  { path: '/customers', label: 'Customers', icon: HiOutlineUsers, roles: ['owner', 'admin', 'service_advisor', 'receptionist'] },
  { path: '/vehicles', label: 'Vehicles', icon: HiOutlineTruck, roles: ['owner', 'admin', 'service_advisor', 'receptionist'] },
  { path: '/inventory', label: 'Inventory', icon: HiOutlineCube, roles: ['owner', 'admin', 'service_advisor'] },
  { path: '/invoices', label: 'Invoices', icon: HiOutlineDocumentText, roles: ['owner', 'admin', 'service_advisor'] },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog, roles: ['owner', 'admin'] },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className={`fixed left-0 top-0 bottom-0 bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-all duration-250 overflow-hidden ${collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'} max-md:-translate-x-full max-md:hidden`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 min-h-sidebar-collapsed">
        <div className="w-9 h-9 shrink-0">
          <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
            <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
            <path d="M10 22V14L16 10L22 14V22L16 18L10 22Z" fill="white" fillOpacity="0.9" />
            <path d="M16 10V18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#3B5FF8" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {!collapsed && <span className="text-xl font-extrabold text-white whitespace-nowrap tracking-tight bg-linear-to-br from-white to-white/70 bg-clip-text text-transparent">GarageFlow</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left truncate ${
                isActive 
                  ? 'bg-linear-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-500/30' 
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`
            }
            end={item.path === '/'}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="text-xl shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-2 py-2 mb-2" title={collapsed ? user?.name : undefined}>
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-sm truncate">{user?.name}</span>
              <span className="text-gray-400 text-xs capitalize truncate">{user?.role?.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button 
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left truncate text-gray-500 hover:text-danger hover:bg-danger/10" 
          onClick={logout} 
          title="Logout"
        >
          <HiOutlineLogout className="text-xl shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Toggle */}
        <button 
          className="flex items-center justify-center w-full p-2.5 rounded-lg text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all text-base mt-1" 
          onClick={onToggle}
        >
          {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
        </button>
      </div>
    </aside>
  );
}
