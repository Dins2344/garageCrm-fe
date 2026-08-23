import { useLocation } from 'react-router-dom';
import { HiOutlineMenuAlt2, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { formatDate } from '../../utils/format';
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
  const { activeGarageName, locale } = useGarage();

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
    <header className="h-header bg-bone-50 border-b border-bone-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-bone-200 hover:text-gray-900 transition-colors -ml-1"
          onClick={onMobileMenuOpen}
          id="mobile-menu-toggle"
          title="Open menu"
        >
          <HiOutlineMenuAlt2 className="text-2xl" />
        </button>

        <div className="flex flex-col">
          <h2 className="font-display text-xl font-bold tracking-tight text-gray-900 leading-tight">{getTitle()}</h2>
          {location.pathname === '/' && (
            <p className="text-sm text-gray-600 font-medium">
              {getGreeting()}, <strong className="text-primary-600">{user?.name?.split(' ')[0]}</strong>{' '}
              <Hand className="inline w-4 h-4 text-amber-500" strokeWidth={1.5} />
            </p>
          )}
        </div>
      </div>

      {activeGarageName && (
        <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-800 bg-bone-100 px-4 py-1.5 border border-bone-200 absolute left-1/2 -translate-x-1/2">
          <HiOutlineOfficeBuilding className="text-primary-600" />
          {activeGarageName}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="tabular hidden sm:flex items-center text-sm font-medium text-gray-700 bg-bone-100 px-4 py-1.5 border border-bone-200">
          {formatDate(new Date(), locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
