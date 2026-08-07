import React from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineX } from 'react-icons/hi';
import Button from './Button';

export function ModalOverlay({ children, onClose }) {
  React.useEffect(() => {
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

export function Modal({ children, className = '', onClose }) {
  const hasMaxWidth = className.includes('max-w-');
  const hasOverflow = className.includes('overflow-');
  
  return (
    <div 
      className={`bg-white rounded-2xl w-full ${hasMaxWidth ? '' : 'max-w-[600px]'} ${hasOverflow ? '' : 'overflow-y-auto'} max-h-[85vh] shadow-xl animate-[slideUp_0.3s_ease] ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function ModalHeader({ title, onClose }) {
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

export function ModalBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 pb-6 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}
