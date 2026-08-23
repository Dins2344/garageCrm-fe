import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminLogin } from '../../services/apiServices/adminService';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from '../../utils/constants';
import { ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, data } = await adminLogin(email, password);
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data));
      toast.success('Admin login successful');
      navigate('/admin/overview');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="on-ink min-h-screen bg-ink-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-white/20 bg-white/10 mb-4">
             <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Platform Admin</h1>
          <p className="text-white/60 mt-2">GaragePulse Control Center</p>
        </div>

        <div className="bg-white/5 border border-white/15 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-ink-800 border border-white/20 text-white focus:outline-none focus:border-accent-400 transition-colors"
                placeholder="admin@garagepulse.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Security Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-ink-800 border border-white/20 text-white focus:outline-none focus:border-accent-400 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-accent-500 text-ink-900 font-bold text-lg hover:bg-accent-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Access Command Center'}
            </button>
          </form>
        </div>
        <p className="text-center text-gray-500 text-sm mt-8">
          Unauthorized access attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
}
