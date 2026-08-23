import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Receipt, Package, ArrowLeft } from 'lucide-react';

/**
 * The shell every signed-out page sits in: sign in, register, forgot password
 * and reset password.
 *
 * It is the Service Counter system from DESIGN.md at page scale — two grounds
 * meeting at the viewport's own edge, with no card floating on a third
 * background. The ink half carries the argument, the bone half carries the
 * form. Below `lg` the ink half is dropped rather than stacked: a visitor who
 * has already decided to sign in does not need the pitch, and on a phone it
 * would push the form below the fold.
 *
 * This exists so the four auth pages share one panel instead of three copies of
 * it. Two panels that look 95% alike will drift.
 */

const PITCH = [
  {
    icon: ClipboardList,
    title: 'Job cards',
    body: 'Every vehicle from intake to delivery, on one card with its own audit trail.',
  },
  {
    icon: Receipt,
    title: 'Estimates and invoices',
    body: 'Send an estimate for approval, convert it to an invoice, export the PDF.',
  },
  {
    icon: Package,
    title: 'Inventory',
    body: 'Stock deducts itself when parts go onto a job card. Thresholds flag what to reorder.',
  },
];

interface AuthLayoutProps {
  children: ReactNode;
  /** `wide` fits the registration form's two-column field grid. */
  width?: 'default' | 'wide';
}

export default function AuthLayout({ children, width = 'default' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen font-sans lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">

      {/* ─── Left: the ink panel ─── */}
      <aside className="on-ink relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />

        <Link to="/home" className="relative z-10 flex items-center gap-3">
          <img src="/mainIcon.png" alt="" className="h-9 w-9 object-contain" />
          <span className="font-display text-xl font-bold tracking-tight">GaragePulse</span>
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center py-16">
          <h2 className="font-display text-4xl font-extrabold leading-[1.1] tracking-[-0.03em]">
            Run every branch
            <br />
            of your garage
            <br />
            {/* The band's one point of emphasis. Everything else here stays
                white, so the orange keeps meaning something. */}
            <span className="text-accent-400">from one login.</span>
          </h2>

          <ul className="mt-12">
            {PITCH.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4 border-t border-white/10 py-5 first:border-t-0 first:pt-0">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-white/70" strokeWidth={1.75} />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 border-t border-white/10 pt-6 text-sm text-white/55">
          &copy; {new Date().getFullYear()} GaragePulse. All rights reserved.
        </p>
      </aside>

      {/* ─── Right: the bone panel ─── */}
      <main className="flex min-h-screen flex-col justify-center bg-bone-50 px-5 py-12 sm:px-12 lg:min-h-0 lg:px-16">
        <div className={`mx-auto w-full ${width === 'wide' ? 'max-w-lg' : 'max-w-md'}`}>

          {/* The ink panel is hidden below `lg`, so on a phone this mark is the
              only branding and the only way back to the landing page. */}
          <Link to="/home" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <img src="/mainIcon.png" alt="" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-bold tracking-tight text-gray-900">GaragePulse</span>
          </Link>

          {children}

          <Link
            to="/home"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back to GaragePulse
          </Link>
        </div>
      </main>
    </div>
  );
}
