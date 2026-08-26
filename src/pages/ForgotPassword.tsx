import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '../utils/validation';
import type { z } from 'zod';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/apiServices/authService';
import { Input } from '../components/Form';
import Button from '../components/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { ArrowLeft } from 'lucide-react';

type Step = 'confirm' | 'not-owner' | 'email' | 'sent';

type ForgotValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('confirm');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const handleSubmit = rhfHandleSubmit(async ({ email }) => {
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
      setStep('sent');
    } catch (error) {
      const backendMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(backendMessage || 'Something went wrong. Please try again.');
      setStep('sent');
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout>
      {/* ── Step 1: confirm role ── */}
      {step === 'confirm' && (
        <>
          <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-4xl">
            Forgot your password?
          </h2>
          <p className="mt-3 text-gray-600">
            Only the garage owner can reset a password by email. Which are you?
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button
              type="button"
              variant="accent"
              className="w-full py-4 text-base"
              onClick={() => setStep('email')}
            >
              I&rsquo;m the owner
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full py-4 text-base"
              onClick={() => setStep('not-owner')}
            >
              I&rsquo;m a staff member
            </Button>
          </div>
        </>
      )}

      {/* ── Not the owner: no email collected, no request sent ── */}
      {step === 'not-owner' && (
        <>
          <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-4xl">
            Ask your owner or admin
          </h2>
          <p className="mt-6 border-t border-bone-200 pt-6 leading-relaxed text-gray-600">
            Staff passwords are managed by the garage. Ask your owner or an admin to reset
            yours from Settings, under Staff.
          </p>
          <button
            type="button"
            onClick={() => setStep('confirm')}
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back
          </button>
        </>
      )}

      {/* ── Step 2: owner enters email ── */}
      {step === 'email' && (
        <>
          <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-4xl">
            Reset your password
          </h2>
          <p className="mt-3 text-gray-600">
            Enter your account email and we&rsquo;ll send you a link to set a new password.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-gray-900">
                Email Address
              </label>
              <Input
                id="reset-email"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                error={!!errors.email}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p role="alert" className="text-danger text-[13px] mt-1">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" variant="accent" className="mt-1 w-full py-4 text-base" disabled={loading}>
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-900/25 border-t-ink-900" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setStep('confirm')}
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back
          </button>
        </>
      )}

      {/* ── Step 3: result of the reset request ── */}
      {step === 'sent' && (
        <>
          <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-4xl">
            Check your email
          </h2>
          {/* The server deliberately returns the same message whether or not the
              address exists, so this is the whole answer the user gets. */}
          <p className="mt-6 border-t border-bone-200 pt-6 leading-relaxed text-gray-600">{message}</p>
        </>
      )}

      <div className="mt-10 border-t border-bone-200 pt-6">
        <Link
          to="/login"
          className="text-sm font-bold text-primary-600 transition-colors hover:text-primary-700 hover:underline"
        >
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
