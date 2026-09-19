import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Form';

/**
 * A password field with a show/hide toggle.
 *
 * Forwards its ref: react-hook-form's `register()` returns a `ref` alongside
 * `name`/`onChange`/`onBlur`, and without forwarding it the field is
 * registered but never focusable — `setFocus` and the focus-first-error
 * behaviour both silently do nothing.
 */
const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  function PasswordInput({ placeholder, error, ...props }, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        error={error}
        {...props}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});

export default PasswordInput;
