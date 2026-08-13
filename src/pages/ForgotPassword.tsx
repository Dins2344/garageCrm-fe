import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/apiServices/authService';
import { Input } from '../components/Form';
import Button from '../components/Button';

type Step = 'confirm' | 'not-owner' | 'email' | 'sent';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('confirm');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-linear-to-br from-primary-400/20 to-purple-500/20 blur-3xl opacity-60 mix-blend-multiply" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-linear-to-tr from-accent-400/20 to-blue-500/20 blur-3xl opacity-60 mix-blend-multiply" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10">
        <div className="flex justify-center mb-8">
          <img src="/mainIcon.png" alt="GaragePulse Logo" className="w-14" />
        </div>

        {/* ── Step 1: confirm role ── */}
        {step === 'confirm' && (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Forgot your password?</h2>
              <p className="text-gray-500 text-sm">
                Are you the owner of your garage account?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="primary"
                className="w-full py-3.5 text-base shadow-lg shadow-primary-500/30"
                onClick={() => setStep('email')}
              >
                Yes, I'm the owner
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full py-3.5 text-base"
                onClick={() => setStep('not-owner')}
              >
                No, I'm a staff member
              </Button>
            </div>
          </>
        )}

        {/* ── Not the owner: no email collected, no request sent ── */}
        {step === 'not-owner' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Ask your owner or admin</h2>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center">
              <p className="text-gray-700 text-sm leading-relaxed">
                Staff passwords are managed by the garage. Ask your owner or an admin to reset your password from Settings → Staff.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="mt-6 w-full text-center text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Back
            </button>
          </>
        )}

        {/* ── Step 2: owner enters email ── */}
        {step === 'email' && (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Reset your password</h2>
              <p className="text-gray-500 text-sm">
                Enter your account email and we'll send you a link to reset your password.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="py-3"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3.5 text-base shadow-lg shadow-primary-500/30 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="mt-4 w-full text-center text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              Back
            </button>
          </>
        )}

        {/* ── Step 3: result of the reset request ── */}
        {step === 'sent' && (
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 text-center">
            <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors hover:underline text-sm">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
