import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface GlobalLoaderContextValue {
  withLoader: <T>(fn: () => Promise<T>) => Promise<T>;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | null>(null);

/**
 * Provides a full-screen blocking overlay while any async mutation is running.
 *
 * Usage inside any component:
 *   const { withLoader } = useGlobalLoader();
 *   const handleSave = () => withLoader(() => saveData());
 */
export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);

  /**
   * Wraps an async function: shows the overlay, awaits it, then hides.
   * Always returns the resolved value so callers can chain normally.
   */
  const withLoader = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setActive(true);
    try {
      return await fn();
    } finally {
      setActive(false);
    }
  }, []);

  return (
    <GlobalLoaderContext.Provider value={{ withLoader }}>
      {children}

      {/* Full-screen blocking overlay */}
      {active && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm"
          aria-label="Loading, please wait"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Spinner ring */}
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" />
            </div>
            <p className="text-white text-sm font-semibold tracking-wide select-none">
              Please wait…
            </p>
          </div>
        </div>
      )}
    </GlobalLoaderContext.Provider>
  );
}

export function useGlobalLoader(): GlobalLoaderContextValue {
  const ctx = useContext(GlobalLoaderContext);
  if (!ctx) throw new Error('useGlobalLoader must be used inside GlobalLoaderProvider');
  return ctx;
}
