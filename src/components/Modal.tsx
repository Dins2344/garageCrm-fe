import { useEffect, type ReactNode, type MouseEventHandler } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineX } from 'react-icons/hi';
import Button from './Button';

interface ModalOverlayProps {
  children: ReactNode;
  onClose?: () => void;
}

export function ModalOverlay({ children, onClose }: ModalOverlayProps) {
  useEffect(() => {
    // Prevent scrolling on body when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalRoot = document.body;
  if (!modalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-ink-900/70 flex items-center justify-center z-[1000] p-5 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      {children}
    </div>,
    modalRoot
  );
}

interface ModalProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

export function Modal({ children, className = '' }: ModalProps) {
  const hasMaxWidth = className.includes('max-w-');
  const hasOverflow = className.includes('overflow-');

  const stopPropagation: MouseEventHandler<HTMLDivElement> = (e) => e.stopPropagation();

  return (
    <div
      className={`bg-bone-50 border border-bone-300 w-full ${hasMaxWidth ? '' : 'max-w-[600px]'} ${hasOverflow ? '' : 'overflow-y-auto'} max-h-[85vh] animate-[slideUp_0.3s_ease] ${className}`}
      onClick={stopPropagation}
    >
      {children}
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-bone-200 px-6 py-5">
      {/* Was gradient-clipped text. Emphasis comes from weight and the display
          face, not from a gradient. */}
      <h2 className="font-display text-lg font-bold tracking-tight text-gray-900">{title}</h2>
      {onClose && (
        <Button variant="ghost" size="icon" onClick={onClose}>
          <HiOutlineX />
        </Button>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`px-6 pb-6 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}
