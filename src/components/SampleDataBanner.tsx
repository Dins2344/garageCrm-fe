import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from './Button';
import { useConfirm } from './ConfirmModal';
import { removeSampleData } from '../services/apiServices/garageService';

interface Props {
  /** True while the current garage still holds seeded rows. */
  visible: boolean;
  /** Refetch whatever told the caller sample data existed. */
  onRemoved: () => void;
}

/**
 * Tells the owner the numbers on screen are demo data, and offers to clear it.
 *
 * **Deliberately not dismissible.** A dismissible banner gets waved away on day
 * one and the sample rows then sit in the customer list unlabelled forever,
 * which is how someone ends up phoning "Rahul Sharma". This one leaves when the
 * data leaves. Settings carries the same action for anyone arriving later.
 */
export default function SampleDataBanner({ visible, onRemoved }: Props) {
  const [removing, setRemoving] = useState(false);
  const { confirm, ConfirmModal } = useConfirm();

  const handleRemove = async () => {
    const ok = await confirm({
      title: 'Remove sample data?',
      message:
        'This deletes the example customers, vehicles, job cards and invoice that came with your garage. Anything you have added yourself is kept.',
      confirmLabel: 'Remove',
      intent: 'danger',
    });
    if (!ok) return;

    setRemoving(true);
    try {
      await removeSampleData();
      toast.success('Sample data removed');
      onRemoved();
    } catch {
      // A server answer, not a field error — a toast is the right shape.
      toast.error('Could not remove sample data. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div
        data-testid="sample-data-banner"
        className="flex items-center gap-3 border border-bone-400 bg-bone-50 px-4 py-3 mb-6"
      >
        <FlaskConical className="w-5 h-5 text-warning shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Sample data</p>
          <p className="text-[13px] text-gray-600">
            Example records so you can look around. Remove them when you are ready.
          </p>
        </div>
        {/* Labelled, not just "Remove": the confirm dialog's own button says
            "Remove" too, and out of context the bare word says nothing about
            what it removes. Matches the mobile accessibilityLabel. */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRemove}
          disabled={removing}
          aria-label="Remove sample data"
        >
          {removing ? 'Removing...' : 'Remove'}
        </Button>
      </div>
      <ConfirmModal />
    </>
  );
}
