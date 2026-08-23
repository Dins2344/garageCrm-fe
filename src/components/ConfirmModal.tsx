import { useState, useCallback, useRef, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineExclamation, HiOutlineTrash, HiOutlineBan } from 'react-icons/hi';
import Button from './Button';

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

interface IntentConfig {
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  btnClass: string;
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

  const intentConfig: Record<ConfirmIntent, IntentConfig> = {
    danger: {
      icon: HiOutlineTrash,
      iconBg: 'bg-danger-light',
      iconColor: 'text-danger',
      btnClass: 'bg-danger hover:bg-red-700 text-white',
    },
    warning: {
      icon: HiOutlineBan,
      iconBg: 'bg-warning-light',
      iconColor: 'text-warning-dark',
      btnClass: 'bg-warning-dark hover:bg-warning text-white',
    },
    default: {
      icon: HiOutlineExclamation,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      btnClass: 'bg-primary-600 hover:bg-primary-700 text-white',
    },
  };

  function ConfirmModal() {
    if (!state) return null;

    const cfg = intentConfig[state.intent] ?? intentConfig.default;
    const Icon = cfg.icon;
    const modalRoot = document.body;
    if (!modalRoot) return null;

    return createPortal(
      // Backdrop
      <div
        className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-ink-900/70 animate-[fadeIn_0.15s_ease]"
        onClick={handleCancel}
      >
        {/* Panel */}
        <div
          className="bg-bone-50 border border-bone-300 w-full max-w-[420px] p-7 animate-[slideUp_0.2s_ease] flex flex-col gap-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon + Text */}
          <div className="flex gap-4 items-start">
            <div className={`shrink-0 w-11 h-11 ${cfg.iconBg} flex items-center justify-center`}>
              <Icon className={`text-xl ${cfg.iconColor}`} />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-display text-base font-bold tracking-tight text-gray-900 mb-1">{state.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{state.message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleCancel}>
              {state.cancelLabel}
            </Button>
            <button
              onClick={handleConfirm}
              className={`inline-flex items-center gap-1.5 border border-transparent px-4 py-2 text-sm font-bold transition-colors ${cfg.btnClass}`}
            >
              {state.confirmLabel}
            </button>
          </div>
        </div>
      </div>,
      modalRoot
    );
  }

  return { confirm, ConfirmModal };
}
