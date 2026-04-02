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
import './Sidebar.css';

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
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg viewBox="0 0 32 32" fill="none">
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
        {!collapsed && <span className="logo-text">GarageFlow</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            end={item.path === '/'}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="nav-icon" />
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {!collapsed && (
              <div className="nav-indicator" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* User info */}
        <div className="sidebar-user" title={collapsed ? user?.name : undefined}>
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role?.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="nav-item logout-btn" onClick={logout} title="Logout">
          <HiOutlineLogout className="nav-icon" />
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>

        {/* Toggle */}
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
        </button>
      </div>
    </aside>
  );
}
