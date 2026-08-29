import { forwardRef, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/**
 * One control for the whole app.
 *
 * There used to be two surfaces here — a rounded, soft-focus "product" input
 * and a square "counter" one for the auth pages. The app now runs on a single
 * system (DESIGN.md), so they collapsed into this: square, a one-pixel
 * Bone Edge border, and a border colour change on focus rather than a halo.
 *
 * The border is bone-400 and not bone-200 on purpose. bone-200 is the
 * *divider* token and gives about 1.2:1 against the bone ground, which is a
 * control edge nobody can see; WCAG asks 3:1 for anything operable.
 */
const baseInputStyles = "w-full px-3.5 py-3 border border-bone-400 text-[15px] text-gray-900 bg-bone-50 transition-colors duration-150 outline-none focus:border-primary-600 placeholder:text-gray-500 disabled:bg-bone-100 disabled:text-gray-500 disabled:cursor-not-allowed";
const errorStyles = "border-danger focus:border-danger";

interface FormFieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * The control is nested *inside* the `<label>` rather than linked by
 * `htmlFor`/`id`. That gives the association for free — no id to invent per
 * field, none to collide when the same form renders twice — and it is what
 * makes `getByLabelText` work, which is how this repo's tests are told to
 * select inputs. The same shape is used by the local `FormField` in
 * `pages/Settings.tsx`.
 */
export function FormField({ label, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`mb-5 ${className}`}>
      {label ? (
        <label className="block">
          <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>
          {children}
        </label>
      ) : (
        children
      )}
      {error && <p role="alert" className="text-danger text-[13px] mt-1">{error}</p>}
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
        className={`${baseInputStyles} ${error ? errorStyles : ''} appearance-none pr-10`}
        {...props}
      >
        {children}
      </select>
      <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150 group-focus-within:text-primary-500 text-gray-500`}>
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
      className={`${baseInputStyles} ${error ? errorStyles : ''} min-h-[100px] resize-y ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
