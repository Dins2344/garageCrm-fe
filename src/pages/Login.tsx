import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, type RegisterFormValues } from '../utils/validation';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Input, Select } from '../components/Form';
import Button from '../components/Button';
import { useCountries } from '../hooks/useCountries';
import { DEFAULT_LOCALE, timezoneChoicesFor } from '../utils/locale';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const { countries } = useCountries();
  const navigate = useNavigate();

  // One form object serves both modes; the *schema* is what changes. In sign-in
  // mode the extra registration fields are not rendered, so validating them
  // would block a perfectly good login.
  const {
    register: field,
    handleSubmit: rhfHandleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema) as never,
    defaultValues: {
      name: '', email: '', phone: '', password: '', garageName: '',
      // India by default, matching the server: every garage created before the
      // picker existed is Indian, and it stays the common case.
      country: DEFAULT_LOCALE.country,
      timezone: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const country = watch('country');
  const selectedCountry = countries.find(c => c.code === country);
  const timezoneOptions = timezoneChoicesFor(country);
  // Only ask for a zone when the country genuinely spans several. The server
  // ignores it otherwise, so hiding the field keeps the form honest.
  const needsTimezone = (selectedCountry?.requiresTimezoneChoice ?? false) && timezoneOptions.length > 0;

  // Registering `country` normally, then clearing the zone alongside it:
  // 'America/Denver' on a garage that just switched to Australia would be
  // worse than no value at all.
  const countryField = field('country');
  const handleCountryChange: typeof countryField.onChange = async (e) => {
    await countryField.onChange(e);
    setValue('timezone', '');
  };

  const handleSubmit = rhfHandleSubmit(async (form) => {
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
  });

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {isRegister && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-900">Your Name</label>
                <Input
                  id="name"
                  type="text"
                  {...field('name')}
                  placeholder="John Doe"
                  error={!!errors.name}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p role="alert" className="mt-1 text-[13px] text-danger">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="garageName" className="mb-2 block text-sm font-semibold text-gray-900">Garage Name</label>
                <Input
                  id="garageName"
                  type="text"
                  {...field('garageName')}
                  placeholder="Speed Auto Works"
                  error={!!errors.garageName}
                  aria-invalid={!!errors.garageName}
                />
                {errors.garageName && (
                  <p role="alert" className="mt-1 text-[13px] text-danger">{errors.garageName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="country" className="mb-2 block text-sm font-semibold text-gray-900">Country</label>
                <Select
                  id="country"
                  {...countryField}
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
                  {...field('phone')}
                  placeholder={selectedCountry?.phoneExample ?? DEFAULT_LOCALE.phoneExample}
                  error={!!errors.phone}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p role="alert" className="mt-1 text-[13px] text-danger">{errors.phone.message}</p>
                )}
              </div>
            </div>
            {needsTimezone && (
              <div>
                <label htmlFor="timezone" className="mb-2 block text-sm font-semibold text-gray-900">Timezone</label>
                <Select id="timezone" {...field('timezone')}>
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
            {...field('email')}
            placeholder="you@example.com"
            error={!!errors.email}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p role="alert" className="mt-1 text-[13px] text-danger">{errors.email.message}</p>
          )}
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
              {...field('password')}
              placeholder="At least 6 characters"
              error={!!errors.password}
              aria-invalid={!!errors.password}
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
          {errors.password && (
            <p role="alert" className="mt-1 text-[13px] text-danger">{errors.password.message}</p>
          )}
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
