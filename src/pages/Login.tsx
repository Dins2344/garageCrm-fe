import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Input, Select } from '../components/Form';
import Button from '../components/Button';
import { useCountries } from '../hooks/useCountries';
import { DEFAULT_LOCALE, timezoneChoicesFor } from '../utils/locale';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';

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
    <AuthLayout width="wide">
      <div className="mb-9">
        <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-4xl">
          {isRegister ? 'Register your garage' : 'Welcome back'}
        </h2>
        <p className="mt-3 text-gray-600">
          {isRegister
            ? 'Set the country and the rest follows: currency, tax label, date format.'
            : 'Sign in to manage your workshop.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {isRegister && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-900">Your Name</label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label htmlFor="garageName" className="mb-2 block text-sm font-semibold text-gray-900">Garage Name</label>
                <Input
                  id="garageName"
                  type="text"
                  name="garageName"
                  value={form.garageName}
                  onChange={handleChange}
                  placeholder="Speed Auto Works"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="country" className="mb-2 block text-sm font-semibold text-gray-900">Country</label>
                <Select
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={handleCountryChange}
                >
                  {/* Until the list loads, offer the default so the field
                      is never empty and signup is never blocked by it. */}
                  {countries.length === 0 ? (
                    <option value={DEFAULT_LOCALE.country}>India</option>
                  ) : (
                    countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)
                  )}
                </Select>
                <p className="mt-2 text-xs text-gray-600">
                  Sets your currency, {(selectedCountry?.taxLabel ?? DEFAULT_LOCALE.taxLabel)} label and date format.
                </p>
              </div>
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-900">Phone Number</label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={selectedCountry?.phoneExample ?? DEFAULT_LOCALE.phoneExample}
                  required
                />
              </div>
            </div>
            {needsTimezone && (
              <div>
                <label htmlFor="timezone" className="mb-2 block text-sm font-semibold text-gray-900">Timezone</label>
                <Select id="timezone" name="timezone" value={form.timezone} onChange={handleChange} required>
                  <option value="">Select your timezone</option>
                  {timezoneOptions.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-gray-600">
                  Service reminders go out at 9:00 AM in this timezone.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-900">Email Address</label>
          <Input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900">Password</label>
            {!isRegister && (
              <Link to="/forgot-password" className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700">
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-900"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="accent"
          className="mt-3 w-full py-4 text-base"
          disabled={loading}
          id="login-submit"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-900/25 border-t-ink-900" />
          ) : (
            isRegister ? 'Create Garage Account' : 'Sign In'
          )}
        </Button>
      </form>

      <p className="mt-8 border-t border-bone-200 pt-6 text-gray-600">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          className="font-bold text-primary-600 transition-colors hover:text-primary-700 hover:underline"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Sign In' : 'Register your garage'}
        </button>
      </p>
    </AuthLayout>
  );
}
