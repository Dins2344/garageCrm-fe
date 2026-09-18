import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Input } from './Form';
import Button from './Button';
import { deleteAccount } from '../services/apiServices/authService';

interface DeleteAccountModalProps {
  open: boolean;
  /** Owners take their garages with them; staff only their own login. The copy differs. */
  isOwner: boolean;
  onClose: () => void;
  /** Called once the server has deleted the account; the caller signs out. */
  onDeleted: () => void;
}

const apiMessage = (e: unknown, fallback: string): string =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/**
 * The confirmation step of account deletion. Re-entering the password is
 * the confirmation — a click-through dialog is not enough for something
 * that removes a garage's whole history — and the button stays disabled
 * until something has been typed so a stray Enter cannot submit it.
 */
export default function DeleteAccountModal({ open, ...rest }: DeleteAccountModalProps) {
  // Mounted only while open, so every opening starts with blank state and
  // nothing has to be reset in an effect.
  return open ? <DeleteAccountForm {...rest} /> : null;
}

function DeleteAccountForm({ isOwner, onClose, onDeleted }: Omit<DeleteAccountModalProps, 'open'>) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteAccount(password);
      onDeleted();
    } catch (err) {
      setError(apiMessage(err, 'Could not delete the account. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={submitting ? () => {} : onClose}>
      <Modal className="max-w-md">
        <ModalHeader title="Delete account" onClose={onClose} />
        <form onSubmit={handleSubmit} noValidate>
          <ModalBody>
            <div className="flex items-start gap-3 border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-semibold">This cannot be undone.</p>
                {isOwner ? (
                  <p className="mt-1">
                    Every branch you own will be deleted along with its staff logins, customers,
                    vehicles, job cards, invoices and reminders. Download any invoices you need first.
                  </p>
                ) : (
                  <p className="mt-1">
                    Your login will be removed. The garage&rsquo;s records, including job cards you
                    worked on, stay with the garage.
                  </p>
                )}
              </div>
            </div>

            <label className="block mt-5 text-sm font-semibold text-gray-900" htmlFor="delete-account-password">
              Enter your password to confirm
            </label>
            <Input
              id="delete-account-password"
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your current password"
              className="mt-2"
              error={!!error}
              aria-invalid={!!error}
            />
            {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" disabled={!password || submitting}>
              {submitting ? 'Deleting...' : 'Delete my account'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </ModalOverlay>
  );
}
