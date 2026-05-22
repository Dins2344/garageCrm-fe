import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminLogin } from '../../services/apiServices/adminService';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, data } = await adminLogin(email, password);
      localStorage.setItem('garagepulse_admin_token', token);
      localStorage.setItem('garagepulse_admin_user', JSON.stringify(data));
      toast.success('Admin login successful');
      navigate('/admin/overview');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg shadow-primary-500/30 mb-4">
             <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Admin</h1>
          <p className="text-gray-400 mt-2">GaragePulse Control Center</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="admin@garagepulse.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Security Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-lg hover:from-primary-500 hover:to-purple-500 transition-all disabled:opacity-50 shadow-lg shadow-primary-900/20"
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
