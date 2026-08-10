import { useLocation } from 'react-router-dom';
import { HiOutlineBell, HiOutlineSearch, HiOutlineMenuAlt2 } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { Hand } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/vehicles': 'Vehicles',
  '/jobcards': 'Job Cards',
  '/inventory': 'Inventory',
  '/invoices': 'Invoices',
  '/settings': 'Settings',
};

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();

  const getTitle = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    if (path.startsWith('/jobcards/')) return 'Job Card Details';
    if (path.startsWith('/customers/')) return 'Customer Details';
    if (path.startsWith('/invoices/')) return 'Invoice Details';
    return 'GaragePulse';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="h-header bg-white/70 backdrop-blur-md border-b border-gray-100/50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors -ml-1"
          onClick={onMobileMenuOpen}
          id="mobile-menu-toggle"
          title="Open menu"
        >
          <HiOutlineMenuAlt2 className="text-2xl" />
        </button>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{getTitle()}</h2>
          {location.pathname === '/' && (
            <p className="text-sm text-gray-500 font-medium">
              {getGreeting()}, <strong className="text-primary-600">{user?.name?.split(' ')[0]}</strong>{' '}
              <Hand className="inline w-4 h-4 text-amber-500" strokeWidth={1.5} />
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-[280px] h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none transition-all focus:bg-white focus:border-primary-400 focus:shadow-[0_0_0_3px_rgba(59,95,248,0.1)]"
          />
        </div>

        <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors" id="notification-bell">
          <HiOutlineBell className="text-xl" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />
        </button>

        <div className="hidden sm:flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </div>
      </div>
    </header>
  );
}
