import { useState, useCallback, useRef } from 'react';
import { TriangleAlert, Trash2, Ban } from 'lucide-react';
import Button from './Button';
import { ModalOverlay, Modal } from './Modal';

type ConfirmIntent = 'danger' | 'warning' | 'default';

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: ConfirmIntent;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  intent: ConfirmIntent;
}

/**
 * useConfirm — drop-in, promise-based replacement for window.confirm().
 *
 * Usage:
 *   const { confirm, ConfirmModal } = useConfirm();
 *
 *   // In your handler:
 *   const ok = await confirm({
 *     title: 'Delete vehicle?',
 *     message: 'This action cannot be undone.',
 *     confirmLabel: 'Delete',    // optional, default 'Confirm'
 *     intent: 'danger',          // optional: 'danger' | 'warning' | default
 *   });
 *   if (!ok) return;
 *   // …proceed
 *
 *   // In your JSX:
 *   <ConfirmModal />
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null); // null = closed
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        title: options.title || 'Are you sure?',
        message: options.message || 'This action cannot be undone.',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        intent: options.intent || 'danger',
      });
    });
  }, []);

  const handleConfirm = () => {
    setState(null);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState(null);
    resolveRef.current?.(false);
  };

  // Every intent is a committing action, so the confirm button is always the
  // danger variant; only the icon says what kind of commitment.
  const intentIcon = {
    danger: <Trash2 className="w-5 h-5 text-danger" />,
    warning: <Ban className="w-5 h-5 text-warning-dark" />,
    default: <TriangleAlert className="w-5 h-5 text-primary-600" />,
  };

  function ConfirmModal() {
    if (!state) return null;
    // ponytail: sits above an already-open modal by portal order (it mounts later), not by z-index.
    return (
      <ModalOverlay onClose={handleCancel}>
        <Modal className="max-w-[420px] p-7 flex flex-col gap-5">
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-11 h-11 bg-bone-100 flex items-center justify-center">{intentIcon[state.intent]}</div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-display text-base font-bold tracking-tight text-gray-900 mb-1">{state.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{state.message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleCancel}>{state.cancelLabel}</Button>
            <Button variant="danger" onClick={handleConfirm}>{state.confirmLabel}</Button>
          </div>
        </Modal>
      </ModalOverlay>
    );
  }

  return { confirm, ConfirmModal };
}
