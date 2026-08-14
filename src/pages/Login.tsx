import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Input, Select } from '../components/Form';
import Button from '../components/Button';
import { useCountries } from '../hooks/useCountries';
import { DEFAULT_LOCALE, timezoneChoicesFor } from '../utils/locale';
import { ClipboardList, Receipt, Package, Eye, EyeOff } from 'lucide-react';

interface LoginForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  garageName: string;
  country: string;
  timezone: string;
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<LoginForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    garageName: '',
    // India by default, matching the server: every garage created before the
    // picker existed is Indian, and it stays the common case.
    country: DEFAULT_LOCALE.country,
    timezone: ''
  });
  const { login, register } = useAuth();
  const { countries } = useCountries();
  const navigate = useNavigate();

  const selectedCountry = countries.find(c => c.code === form.country);
  const timezoneOptions = timezoneChoicesFor(form.country);
  // Only ask for a zone when the country genuinely spans several. The server
  // ignores it otherwise, so hiding the field keeps the form honest.
  const needsTimezone = (selectedCountry?.requiresTimezoneChoice ?? false) && timezoneOptions.length > 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    // Clear any zone picked for the previous country — 'America/Denver' on a
    // garage that just switched to Australia would be worse than no value.
    setForm({ ...form, country: e.target.value, timezone: '' });
  };

  const handleSubmit = async (e: FormEvent) => {
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
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Something went wrong');
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
            <img src="/mainIcon.png" alt="GaragePulse Logo" className="w-10" />
            <h1 className="text-2xl font-bold tracking-tight">GaragePulse</h1>
          </div>

          <div className="relative z-10 space-y-8 flex-1 flex flex-col justify-center">
            <div className="flex gap-4 items-start group">
              <div className="w-16 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary-500/30 transition-all duration-300 shadow-inner">
                <ClipboardList className="w-6 h-6 text-white/80" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Job Card Management</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Track every vehicle from intake to delivery with organized workflows.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start group">
              <div className="w-16 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/30 transition-all duration-300 shadow-inner">
                <Receipt className="w-6 h-6 text-white/80" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Billing & Invoices</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Generate professional estimations and GST-ready invoices instantly.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start group">
              <div className="w-16 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent-500/30 transition-all duration-300 shadow-inner">
                <Package className="w-6 h-6 text-white/80" strokeWidth={1.5} />
              </div>
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
            <img src="/mainIcon.png" alt="GaragePulse Logo" className="w-14" />
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
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                    <Input
                      id="name"
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
                    <label htmlFor="garageName" className="block text-sm font-semibold text-gray-700 mb-1.5">Garage Name</label>
                    <Input
                      id="garageName"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                    <Select
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleCountryChange}
                      className="py-3"
                    >
                      {/* Until the list loads, offer the default so the field
                          is never empty and signup is never blocked by it. */}
                      {countries.length === 0 ? (
                        <option value={DEFAULT_LOCALE.country}>India</option>
                      ) : (
                        countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)
                      )}
                    </Select>
                    <p className="mt-1 text-xs text-gray-500">
                      Sets your currency, {(selectedCountry?.taxLabel ?? DEFAULT_LOCALE.taxLabel)} label and date format.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder={selectedCountry?.phoneExample ?? DEFAULT_LOCALE.phoneExample}
                      required
                      className="py-3"
                    />
                  </div>
                </div>
                {needsTimezone && (
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-semibold text-gray-700 mb-1.5">Timezone</label>
                    <Select id="timezone" name="timezone" value={form.timezone} onChange={handleChange} className="py-3" required>
                      <option value="">Select your timezone</option>
                      {timezoneOptions.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </Select>
                    <p className="mt-1 text-xs text-gray-500">
                      Service reminders go out at 9:00 AM in this timezone.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <Input
                id="email"
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
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                {!isRegister && (
                  <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
