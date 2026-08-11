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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-[fadeIn_0.2s_ease]"
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
      className={`bg-white rounded-2xl w-full ${hasMaxWidth ? '' : 'max-w-[600px]'} ${hasOverflow ? '' : 'overflow-y-auto'} max-h-[85vh] shadow-xl animate-[slideUp_0.3s_ease] ${className}`}
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
    <div className="pt-6 px-6 flex items-center justify-between">
      <h2 className="text-xl font-bold bg-linear-to-br from-gray-900 to-primary-700 bg-clip-text text-transparent">{title}</h2>
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
