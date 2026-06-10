import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { verifyAdmin } from '../../services/apiServices/adminService';
import { BarChart3, Building2, Users, Zap, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('garagepulse_admin_token');
    if (!token) {
      navigate('/admin-login');
      return;
    }

    verifyAdmin()
      .then(() => setLoading(false))
      .catch(() => {
        localStorage.removeItem('garagepulse_admin_token');
        toast.error('Admin session expired');
        navigate('/admin-login');
      });
  }, [navigate]);

  const navItems = [
    { label: 'Overview', path: '/admin/overview', icon: BarChart3 },
    { label: 'Garages', path: '/admin/garages', icon: Building2 },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'System Health', path: '/admin/health', icon: Zap },
  ];

  if (loading) return null;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-xl text-white shadow-lg shadow-primary-500/20">
              {/* GP */}
              <img src="/mainIcon.png" alt="GaragePulse Logo" className="w-10" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Admin<span className="text-primary-600">Pulse</span></span>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Platform Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${active
                  ? 'bg-primary-50 text-primary-600 shadow-sm shadow-primary-500/5'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              localStorage.removeItem('garagepulse_admin_token');
              navigate('/admin-login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 px-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {navItems.find(i => i.path === location.pathname)?.label || 'Admin'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              System Online
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
