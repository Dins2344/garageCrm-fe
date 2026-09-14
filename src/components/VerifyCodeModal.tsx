import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Input } from './Form';
import Button from './Button';
import { sendVerificationCode, confirmVerificationCode } from '../services/apiServices/authService';
import type { VerificationChannel, VerificationSendResult } from '../types/models';

interface VerifyCodeModalProps {
  /** `null` keeps the modal closed. */
  channel: VerificationChannel | null;
  onClose: () => void;
  /** Called once the server has confirmed; the caller refreshes the user. */
  onVerified: (channel: VerificationChannel) => void;
}

const CHANNEL_LABEL: Record<VerificationChannel, string> = { email: 'email', phone: 'phone number' };

const apiMessage = (e: unknown, fallback: string): string =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/**
 * The code-entry step of owner verification. Sends the code the moment it
 * opens — the owner asked to verify, there is nothing to confirm first — and
 * keeps a resend countdown that mirrors the server's cooldown so the button
 * never offers something the API would refuse.
 */
export default function VerifyCodeModal({ channel, onClose, onVerified }: VerifyCodeModalProps) {
  const [sent, setSent] = useState<VerificationSendResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilResend, setSecondsUntilResend] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = async (target: VerificationChannel) => {
    setSendError(null);
    setError(null);
    try {
      const res = await sendVerificationCode(target);
      setSent(res.data);
      if (res.data.status === 'already-verified') {
        toast.success(`Your ${CHANNEL_LABEL[target]} is already verified`);
        onVerified(target);
        return;
      }
      setSecondsUntilResend(res.data.resendAfterSeconds);
      inputRef.current?.focus();
    } catch (e) {
      setSendError(apiMessage(e, 'Could not send the code. Please try again.'));
    }
  };

  // Reset and send whenever a channel is chosen.
  useEffect(() => {
    if (!channel) return;
    setSent(null);
    setCode('');
    setError(null);
    setSecondsUntilResend(0);
    void send(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => {
    if (secondsUntilResend <= 0) return;
    const id = setTimeout(() => setSecondsUntilResend(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsUntilResend]);

  if (!channel) return null;

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await confirmVerificationCode(channel, code.trim());
      toast.success(`Your ${CHANNEL_LABEL[channel]} is verified`);
      onVerified(channel);
    } catch (err) {
      setError(apiMessage(err, 'Could not verify the code. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const label = CHANNEL_LABEL[channel];

  return (
    <ModalOverlay onClose={onClose}>
      <Modal className="max-w-[440px]">
        <ModalHeader title={`Verify your ${label}`} onClose={onClose} />
        <form onSubmit={handleConfirm} noValidate>
          <ModalBody className="flex flex-col gap-4">
            {sendError ? (
              <p role="alert" className="text-sm text-danger">{sendError}</p>
            ) : sent ? (
              <p className="text-sm text-gray-600">
                We sent a 6-digit code to <span className="font-semibold text-gray-900">{sent.target}</span>.
                It expires in {Math.round(sent.expiresInSeconds / 60)} minutes.
              </p>
            ) : (
              <p className="text-sm text-gray-600">Sending your code...</p>
            )}

            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-1.5">Verification code</span>
              <Input
                ref={inputRef}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                className="tracking-[0.4em] text-lg font-mono"
                error={!!error}
                aria-invalid={!!error}
                disabled={!sent}
              />
            </label>
            {error && <p role="alert" className="text-danger text-[13px] -mt-2">{error}</p>}

            <div className="text-[13px] text-gray-500">
              {secondsUntilResend > 0 ? (
                <span>Resend available in {secondsUntilResend}s</span>
              ) : (
                <button
                  type="button"
                  className="font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  onClick={() => void send(channel)}
                  disabled={!sent && !sendError}
                >
                  {sendError ? 'Try sending again' : 'Resend code'}
                </button>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" icon={ShieldCheck} disabled={!sent || code.length !== 6 || submitting}>
              {submitting ? 'Verifying...' : 'Verify'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </ModalOverlay>
  );
}
