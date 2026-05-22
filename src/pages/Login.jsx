import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Input } from '../components/Form';
import Button from '../components/Button';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    garageName: ''
  });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await register(form);
        toast.success('Garage registered successfully!');
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-linear-to-br from-primary-400/20 to-purple-500/20 blur-3xl opacity-60 mix-blend-multiply" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-linear-to-tr from-accent-400/20 to-blue-500/20 blur-3xl opacity-60 mix-blend-multiply" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-linear-to-r from-success/10 to-primary-300/10 blur-3xl opacity-50 mix-blend-multiply" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40">

        {/* Left Side: Features */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-linear-to-br from-gray-900 to-gray-800 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3 mb-12">
            {/* <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 shadow-lg rounded-xl">
              <rect width="40" height="40" rx="10" fill="url(#lg)"/>
              <path d="M12 28V17L20 12L28 17V28L20 23L12 28Z" fill="white" fillOpacity="0.9"/>
              <path d="M20 12V23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#3B5FF8"/>
                  <stop offset="1" stopColor="#7C3AED"/>
                </linearGradient>
              </defs>
            </svg> */}
            <img src="/GPfavi.png" alt="GaragePulse Logo" className="w-10 h-10" />
            <h1 className="text-2xl font-bold tracking-tight">GaragePulse</h1>
          </div>

          <div className="relative z-10 space-y-8 flex-1 flex flex-col justify-center">
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-primary-500/30 transition-all duration-300 shadow-inner">📋</div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Job Card Management</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Track every vehicle from intake to delivery with organized workflows.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-purple-500/30 transition-all duration-300 shadow-inner">💰</div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Billing & Invoices</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Generate professional estimations and GST-ready invoices instantly.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-accent-500/30 transition-all duration-300 shadow-inner">📦</div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Inventory Tracking</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Never run out of critical parts. Manage stock margins smoothly.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/10 text-sm text-gray-500 font-medium">
            © 2026 GaragePulse. All rights reserved.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-7/12 flex-1 p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white/60">

          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 shadow-md rounded-xl drop-shadow-sm">
              <rect width="40" height="40" rx="10" fill="url(#lg_mobile)" />
              <path d="M12 28V17L20 12L28 17V28L20 23L12 28Z" fill="white" fillOpacity="0.9" />
              <path d="M20 12V23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="lg_mobile" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#3B5FF8" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              {isRegister ? 'Start your free trial' : 'Welcome back'}
            </h2>
            <p className="text-gray-500 text-lg">
              {isRegister ? 'Register your garage and streamline operations.' : 'Sign in to manage your workshop.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isRegister && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                    <Input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Garage Name</label>
                    <Input
                      type="text"
                      name="garageName"
                      value={form.garageName}
                      onChange={handleChange}
                      placeholder="Speed Auto Works"
                      required
                      className="py-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    required
                    className="py-3"
                  />
                </div>
              </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="py-3"
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                {!isRegister && (
                  <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="py-3"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 text-base shadow-lg shadow-primary-500/30 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isRegister ? 'Create Garage Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center animate-in fade-in duration-700">
            <p className="text-gray-600 font-medium">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700 font-bold transition-colors hover:underline"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Sign In' : 'Register your garage'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
