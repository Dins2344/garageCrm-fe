import React from 'react';
import { HiOutlineX } from 'react-icons/hi';
import Button from './Button';

export function ModalOverlay({ children, onClose }) {
  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-1000 p-5 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      {children}
    </div>
  );
}

export function Modal({ children, className = '', onClose }) {
  return (
    <div 
      className={`bg-white rounded-2xl w-full max-w-[600px] max-h-[85vh] overflow-y-auto shadow-xl animate-[slideUp_0.3s_ease] ${className}`}
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
