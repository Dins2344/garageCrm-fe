import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineExclamation, HiOutlineTrash, HiOutlineBan } from 'react-icons/hi';
import Button from './Button';

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
  const [state, setState] = useState(null); // null = closed
  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
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

  const intentConfig = {
    danger: {
      icon: HiOutlineTrash,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      btnClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: HiOutlineBan,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      btnClass: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    default: {
      icon: HiOutlineExclamation,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-500',
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
        className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease]"
        onClick={handleCancel}
      >
        {/* Panel */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] p-7 animate-[slideUp_0.2s_ease] flex flex-col gap-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon + Text */}
          <div className="flex gap-4 items-start">
            <div className={`shrink-0 w-11 h-11 rounded-full ${cfg.iconBg} flex items-center justify-center`}>
              <Icon className={`text-xl ${cfg.iconColor}`} />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-base font-bold text-gray-900 mb-1">{state.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{state.message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleCancel}>
              {state.cancelLabel}
            </Button>
            <button
              onClick={handleConfirm}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${cfg.btnClass}`}
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
