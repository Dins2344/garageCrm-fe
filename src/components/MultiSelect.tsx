import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  /** What the control is filtering — "Status" reads as "Status: All" when nothing is picked. */
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

/**
 * A filter control that lets the reader pick any number of options.
 *
 * Styled as the sibling `Select` so a search box, a single-value select and
 * this sit in one row without looking like three different products. The
 * trigger summarises the selection; the panel lists every option with a
 * check, plus Clear. Closes on outside click and Escape, never on a pick,
 * because the point is choosing several in a row.
 */
export default function MultiSelect({ label, options, value, onChange, className = '' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter(v => v !== option) : [...value, option]);

  const picked = options.filter(o => value.includes(o.value));
  const summary =
    picked.length === 0 ? 'All'
      : picked.length <= 2 ? picked.map(o => o.label).join(', ')
        : `${picked.length} selected`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        // Explicit: the name computed from the two spans loses the space after the colon.
        aria-label={`${label}: ${summary}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 border text-[15px] bg-bone-50 transition-colors duration-150 outline-none ${
          open || picked.length ? 'border-primary-600' : 'border-bone-400'
        } focus:border-primary-600`}
      >
        <span className="truncate text-gray-900">
          <span className="text-gray-500">{label}: </span>{summary}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={panelId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute z-20 mt-1 min-w-full w-max max-w-[280px] bg-bone-50 border border-bone-400 shadow-lg"
        >
          <ul className="max-h-72 overflow-y-auto py-1">
            {options.map(option => {
              const selected = value.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggle(option.value)}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-left text-gray-900 hover:bg-bone-100"
                  >
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 shrink-0 border flex items-center justify-center ${
                        selected ? 'bg-primary-600 border-primary-600 text-white' : 'border-bone-400 bg-transparent'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span>{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-bone-200 px-3.5 py-2">
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={picked.length === 0}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
