import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../utils/validation';
import type { z } from 'zod';
import { Link, useParams } from 'react-router-dom';
import { resetPassword } from '../services/apiServices/authService';
import { Input } from '../components/Form';
import Button from '../components/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { Check } from 'lucide-react';

type ResetValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  // Kept for the server's own message ("link expired"), which no client-side
  // schema can anticipate. Field-level problems come from `errors` instead.
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // The length and match checks that used to live here are now in
  // resetPasswordSchema, which reports them against the field that is wrong
  // instead of as one banner for the whole form.
  const handleSubmit = rhfHandleSubmit(async ({ password }) => {
    setError(null);
    setLoading(true);
    try {
      await resetPassword(token!, password);
      setSuccess(true);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout>
      {success ? (
        <>
          <div className="flex items-center gap-3">
            <Check className="h-7 w-7 shrink-0 text-primary-600" strokeWidth={2.5} />
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-4xl">
              Password reset
            </h2>
          </div>
          <p className="mt-6 border-t border-bone-200 pt-6 leading-relaxed text-gray-600">
            You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex w-full items-center justify-center border border-accent-500 bg-accent-500 px-7 py-4 text-base font-bold text-ink-900 transition-colors hover:border-accent-400 hover:bg-accent-400"
          >
            Go to Sign In
          </Link>
        </>
      ) : (
        <>
          <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-4xl">
            Set a new password
          </h2>
          <p className="mt-3 text-gray-600">
            Choose something at least six characters long.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-gray-900">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                {...register('password')}
                placeholder="At least 6 characters"
                error={!!errors.password}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p role="alert" className="text-danger text-[13px] mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-gray-900">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                {...register('confirmPassword')}
                placeholder="Type it again"
                error={!!errors.confirmPassword}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p role="alert" className="text-danger text-[13px] mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <p role="alert" className="border-l border-danger pl-3 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" variant="accent" className="mt-1 w-full py-4 text-base" disabled={loading}>
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-900/25 border-t-ink-900" />
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
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
