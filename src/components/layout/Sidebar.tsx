import { NavLink } from 'react-router-dom';
import type { ComponentType } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../ConfirmModal';
import type { Role } from '../../types/models';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineCog,
  HiOutlineChevronRight,
  HiOutlineLogout,
  HiOutlineX
} from 'react-icons/hi';

interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid, roles: ['owner', 'admin', 'service_advisor', 'mechanic', 'receptionist'] },
  { path: '/jobcards', label: 'Job Cards', icon: HiOutlineClipboardList, roles: ['owner', 'admin', 'service_advisor', 'mechanic'] },
  { path: '/customers', label: 'Customers', icon: HiOutlineUsers, roles: ['owner', 'admin', 'service_advisor', 'receptionist'] },
  { path: '/vehicles', label: 'Vehicles', icon: HiOutlineTruck, roles: ['owner', 'admin', 'service_advisor', 'receptionist'] },
  // Inventory is disabled — users enter parts manually in estimations
  // { path: '/inventory', label: 'Inventory', icon: HiOutlineCube, roles: ['owner', 'admin', 'service_advisor'] },
  { path: '/invoices', label: 'Invoices', icon: HiOutlineDocumentText, roles: ['owner', 'admin', 'service_advisor'] },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog, roles: ['owner', 'admin', 'service_advisor', 'mechanic', 'receptionist'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { confirm, ConfirmModal } = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out of GaragePulse?',
      message: 'You will need to sign in again to access your account.',
      confirmLabel: 'Log Out',
      intent: 'warning',
    });
    if (ok) logout();
  };

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 bottom-0 bg-gray-900 border-r border-gray-800
          flex flex-col z-50 transition-all duration-300 overflow-hidden

          /* Desktop: always visible, width depends on collapsed state */
          max-md:w-sidebar
          ${collapsed ? 'md:w-sidebar-collapsed' : 'md:w-sidebar'}

          /* Mobile: slide in/out */
          ${mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
        `}
      >
        {/* Top section: Logo + Toggle button */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 min-h-sidebar-collapsed">
          <div className="flex items-center gap-3">
            {(!collapsed || mobileOpen) && (
              <>
                <div className="w-9 h-9 shrink-0">
                  <img src="/mainIcon.png" alt="GaragePulse Logo" className="w-10" />
                </div>
                <span className="text-xl font-extrabold text-white whitespace-nowrap tracking-tight bg-linear-to-br from-white to-white/70 bg-clip-text text-transparent">
                  GaragePulse
                </span>
              </>
            )}
          </div>

          {/* Desktop: collapse/expand toggle (moved to top) */}
          <button
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all text-base shrink-0"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <HiOutlineChevronRight /> : <HiOutlineX />}
          </button>

          {/* Mobile: close button */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all text-lg shrink-0"
            onClick={onMobileClose}
            title="Close sidebar"
          >
            <HiOutlineX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {visibleItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left truncate ${isActive
                  ? 'bg-linear-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-500/30'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`
              }
              end={item.path === '/'}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="text-xl shrink-0" />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
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
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-sm truncate">{user?.name}</span>
                <span className="text-gray-400 text-xs capitalize truncate">{user?.role?.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left truncate text-gray-500 hover:text-danger hover:bg-danger/10"
            onClick={handleLogout}
            title="Logout"
          >
            <HiOutlineLogout className="text-xl shrink-0" />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      <ConfirmModal />
    </>
  );
}
