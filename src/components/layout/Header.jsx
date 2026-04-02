import { useLocation } from 'react-router-dom';
import { HiOutlineBell, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const pageTitles = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/vehicles': 'Vehicles',
  '/jobcards': 'Job Cards',
  '/inventory': 'Inventory',
  '/invoices': 'Invoices',
  '/settings': 'Settings',
};

export default function Header({ collapsed }) {
  const location = useLocation();
  const { user } = useAuth();

  const getTitle = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    if (path.startsWith('/jobcards/')) return 'Job Card Details';
    if (path.startsWith('/customers/')) return 'Customer Details';
    if (path.startsWith('/invoices/')) return 'Invoice Details';
    return 'GarageFlow';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className={`app-header ${collapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
        <div className="header-title-group">
          <h2 className="header-title">{getTitle()}</h2>
          {location.pathname === '/' && (
            <p className="header-greeting">
              {getGreeting()}, <strong>{user?.name?.split(' ')[0]}</strong> 👋
            </p>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="header-search">
          <HiOutlineSearch />
          <input type="text" placeholder="Search anything..." />
        </div>

        <button className="header-notification" id="notification-bell">
          <HiOutlineBell />
          <span className="notification-dot" />
        </button>

        <div className="header-date">
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
