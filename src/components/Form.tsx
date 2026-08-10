import { forwardRef, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const baseInputStyles = "w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-lg text-[15px] text-gray-800 bg-white transition-all duration-150 outline-none focus:border-primary-400 focus:shadow-[0_0_0_3px_rgba(59,95,248,0.1)] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed";
const errorStyles = "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]";

interface FormFieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-danger text-[13px] mt-1">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`${baseInputStyles} ${error ? errorStyles : ''} ${className}`}
      {...props}
    />
  );
});
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', error, children, ...props }, ref) => {
  return (
    <div className={`relative group ${className}`}>
      <select
        ref={ref}
        className={`${baseInputStyles} appearance-none pr-10 ${error ? errorStyles : ''}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors duration-150">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
});
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`${baseInputStyles} min-h-[100px] resize-y ${error ? errorStyles : ''} ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
