import { useState, useEffect, type ReactNode, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList, Users, Receipt, Package, Bell, BarChart3,
  ArrowRight, Shield, Wrench, Car, FileText, Menu, X,
  Building2, ScanLine, Boxes, ShoppingCart, Timer, MessageSquare,
  Lock, KeyRound, Fingerprint, LifeBuoy, BookOpen, DatabaseZap,
} from 'lucide-react';
import { PLAY_STORE_URL } from '../utils/constants';
import { formatMoney } from '../utils/format';

/* ───── Play Store badge ─────
   The one piece of external proof this product genuinely has. */
function PlayStoreBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download GaragePulse for Android on Google Play (opens in a new tab)"
      className={`inline-block transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <img src="/playstore.png" alt="" className="h-11 w-auto object-contain" />
    </a>
  );
}

/* ───── Product photograph ─────
   Real workshop photography with a real screenshot of the product composited
   onto the device — no invented UI. Square-cornered and unframed like every
   other element: no rounded corner, no shadow, no browser chrome.

   Intrinsic width/height are declared so the browser reserves the space before
   the file arrives and the section does not jump on load. */
function ProductImage({ src, alt, width, height, className = '' }: {
  src: string; alt: string; width: number; height: number; className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={`w-full border border-bone-200 bg-bone-100 object-cover ${className}`}
    />
  );
}

/* ───── Market switcher ─────
   The page's one authored interaction, and the only honest way to demonstrate
   the positioning: the same job total, re-printed through the real
   `formatMoney` the product ships, in each market's own currency and tax
   vocabulary. Nothing here is mocked — this is the function the invoices use. */
const MARKETS = [
  { code: 'IN', country: 'India',          locale: 'en-IN', currency: 'INR', taxLabel: 'GST',  taxRate: 18, taxId: 'GSTIN' },
  { code: 'GB', country: 'United Kingdom', locale: 'en-GB', currency: 'GBP', taxLabel: 'VAT',  taxRate: 20, taxId: 'VAT No.' },
  { code: 'AE', country: 'UAE',            locale: 'en-AE', currency: 'AED', taxLabel: 'VAT',  taxRate: 5,  taxId: 'TRN' },
  { code: 'AU', country: 'Australia',      locale: 'en-AU', currency: 'AUD', taxLabel: 'GST',  taxRate: 10, taxId: 'ABN' },
] as const;

const SUBTOTAL = 12500;

function MarketSwitcher() {
  const [index, setIndex] = useState(0);
  const market = MARKETS[index];
  const tax = Math.round(SUBTOTAL * (market.taxRate / 100) * 100) / 100;
  const total = Math.round((SUBTOTAL + tax) * 100) / 100;

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Choose a market">
        {MARKETS.map((m, i) => {
          const active = i === index;
          return (
            <button
              key={m.code}
              role="tab"
              aria-selected={active}
              onClick={() => setIndex(i)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                active
                  ? 'bg-accent-500 text-ink-900'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              }`}
            >
              {m.code}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border border-white/15 bg-white/5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
          Invoice preview &middot; {market.country}
        </p>
        <dl className="mt-4 flex flex-col gap-2.5 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/60">Parts and labour</dt>
            <dd className="tabular font-semibold text-white">{formatMoney(SUBTOTAL, market)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/60">
              {market.taxLabel} ({market.taxRate}%)
            </dt>
            <dd className="tabular font-semibold text-white">{formatMoney(tax, market)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-white/15 pt-3">
            <dt className="font-semibold text-white">Total</dt>
            <dd className="tabular font-display text-2xl font-bold text-accent-400">{formatMoney(total, market)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-white/60">
          Same job card. The tax name, the rate, the currency and the number format all follow the
          branch&rsquo;s country &mdash; and the PDF prints <span className="text-white/70">{market.taxId}</span> on it.
        </p>
      </div>
    </div>
  );
}

/* ───── Navigation ───── */
const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Multi-branch', href: '#branches' },
  { label: 'Security', href: '#security' },
];

function NavBar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? 'border-bone-200 bg-bone-50/95 backdrop-blur' : 'border-transparent bg-bone-50'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5 sm:px-8">
        <Link to="/home" className="flex shrink-0 items-center gap-2.5">
          <img src="/mainIcon.png" alt="" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-bold tracking-tight text-gray-900">GaragePulse</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-7 lg:flex">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {user ? (
            <Link
              to="/"
              className="bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900">
                Sign in
              </Link>
              <Link
                to="/login?register=true"
                className="bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="ml-auto p-2 text-gray-700 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-bone-200 bg-bone-50 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-2 sm:px-8">
            {NAV_LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-gray-100 py-3.5 text-sm font-medium text-gray-700"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 py-4">
              <Link to="/login" className="flex-1 border border-bone-200 py-2.5 text-center text-sm font-semibold text-gray-800">
                Sign in
              </Link>
              <Link to="/login?register=true" className="flex-1 bg-gray-900 py-2.5 text-center text-sm font-semibold text-white">
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ───── Section heading ─────
   No eyebrow label above it. The heading carries its own weight; a small-caps
   category tag above every section is the tell of a template. */
function SectionHeading({ title, lead, align = 'left' }: { title: ReactNode; lead?: string; align?: 'left' | 'center' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {lead && <p className="mt-5 max-w-[68ch] text-base leading-relaxed text-gray-600 sm:text-lg">{lead}</p>}
    </div>
  );
}

/* ───── Alternating product block ───── */
interface ProductBlockProps {
  title: string;
  lead: string;
  points: { icon: ComponentType<{ className?: string; strokeWidth?: number }>; title: string; body: string }[];
  image: { src: string; alt: string; width: number; height: number };
  flip?: boolean;
}

function ProductBlock({ title, lead, points, image, flip }: ProductBlockProps) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div className={flip ? 'lg:order-2' : ''}>
        <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 max-w-[60ch] leading-relaxed text-gray-600">{lead}</p>
        <ul className="mt-8 flex flex-col">
          {points.map(({ icon: Icon, title: t, body }) => (
            <li key={t} className="flex gap-4 border-t border-bone-200 py-5 first:border-t-0 first:pt-0">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.75} />
              <div>
                <p className="font-semibold text-gray-900">{t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={flip ? 'lg:order-1' : ''}>
        <ProductImage {...image} />
      </div>
    </div>
  );
}

/* ───── Capability row ─────
   A ruled list, not a grid of identical icon cards. Same information, far less
   chrome, and it survives long labels without every tile growing to match. */
function CapabilityRow({
  icon: Icon, title, body,
}: { icon: ComponentType<{ className?: string; strokeWidth?: number }>; title: string; body: string }) {
  return (
    <div className="flex gap-5 border-t border-bone-200 py-7">
      <Icon className="mt-1 h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.75} />
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-gray-600">{body}</p>
      </div>
    </div>
  );
}

const CAPABILITIES = [
  { icon: ClipboardList, title: 'Job cards', body: 'Open a card at intake, record complaints and odometer, assign a technician, and move it through a status pipeline that keeps its own audit trail.' },
  { icon: FileText, title: 'Estimations', body: 'Build parts and labour into an estimate, send it for approval, and let the customer accept it from a link without creating an account.' },
  { icon: Receipt, title: 'Invoicing', body: 'Convert an approved estimate into an invoice, track part payments, and export a PDF that prints the right tax label for the branch.' },
  { icon: Boxes, title: 'Inventory', body: 'Stock deducts itself when parts go onto a job card. Low-stock thresholds surface what to reorder before a bay is waiting.' },
  { icon: Users, title: 'Customers and vehicles', body: 'Every vehicle keeps its own service history, so the last job on that registration is one tap away at the counter.' },
  { icon: Bell, title: 'Service reminders', body: 'Scheduled email and SMS reminders go out at nine in the morning in each branch’s own timezone, not yours.' },
  { icon: ScanLine, title: 'Vehicle inspections', body: 'Record inspection findings against the vehicle so the customer sees what was checked, not just what was charged.' },
  { icon: ShoppingCart, title: 'Procurement', body: 'Track what was ordered, from whom, and what it cost, against the job that consumed it.' },
  { icon: BarChart3, title: 'Dashboards', body: 'Revenue, active work, pending approvals and unpaid invoices, per branch, without exporting anything.' },
];

/* ───── Page ───── */
export default function HomePage() {
  // One authored entrance, on the first viewport only, and it runs from CSS
  // rather than from state: every section animating identically on scroll is the
  // same effect eleven times, and an entrance that starts at opacity 0 renders a
  // blank hero for anyone whose animation never runs. See `.hero-rise`.
  return (
    <div className="min-h-screen bg-bone-50 font-sans">
      <NavBar />

      {/* ─── HERO ─── */}
      <section className="on-ink relative overflow-hidden bg-ink-900 text-white">
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
          <div className="hero-rise">
            <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-[3.75rem]">
              Run every branch
              <br />
              of your garage
              <br />
              <span className="text-accent-400">from one login.</span>
            </h1>
            <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-white/70">
              Job cards, estimates, invoicing, inventory and reminders for independent workshops.
              Add a second branch, or a branch in another country, and GaragePulse keeps each one&rsquo;s
              currency, tax rules and paperwork straight.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login?register=true"
                className="group inline-flex items-center justify-center gap-2 bg-accent-500 px-7 py-4 text-base font-bold text-ink-900 transition-colors duration-200 hover:bg-accent-400"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 border border-white/25 px-7 py-4 text-base font-semibold text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/5"
              >
                Book a demo
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <PlayStoreBadge />
              <p className="max-w-[30ch] text-sm leading-snug text-white/50">
                The technician app is live on Android.
              </p>
            </div>
          </div>

          <div className="hero-rise-delayed lg:justify-self-end">
            <MarketSwitcher />
          </div>
        </div>
      </section>

      {/* ─── PRODUCT ─── */}
      <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          title={<>Everything a workshop does in a day, in one place</>}
          lead="Intake to invoice without re-typing the same vehicle into three different tools."
        />
        <div className="mt-16 flex flex-col gap-20 lg:gap-28">
          <ProductBlock
            title="Control the floor and the stockroom together"
            lead="A job card knows what parts it consumed, so your inventory is right without a stock-take."
            image={{
              src: '/landing/01.webp',
              alt: 'A service advisor and the garage owner reviewing a GaragePulse job card on a laptop at the workshop counter, with a car on the lift behind them.',
              width: 1448,
              height: 1086,
            }}
            points={[
              { icon: ClipboardList, title: 'One card per vehicle, start to finish', body: 'Complaints, odometer, technician, status and notes, with a timeline of who changed what and when.' },
              { icon: Package, title: 'Stock that deducts itself', body: 'Parts added to an estimate come off inventory when the job is invoiced. Thresholds flag what to reorder.' },
              { icon: Timer, title: 'No second job card for the same vehicle', body: 'The system refuses to open a duplicate card while one is still open, so two advisors cannot work the same car apart.' },
            ]}
          />
          <ProductBlock
            flip
            title="Keep the customer in the loop without chasing them"
            lead="Estimates go out as a link. The customer approves from their phone, no account, no app."
            image={{
              src: '/landing/02.webp',
              alt: 'A customer standing in the workshop reading the estimate on their phone, with the parts, labour, GST and grand total listed and an Approve Estimation button.',
              width: 1086,
              height: 1448,
            }}
            points={[
              { icon: MessageSquare, title: 'Approval without an account', body: 'A tokenised link opens the estimate. Approve or decline is one tap, and the job card updates the moment they do.' },
              { icon: Bell, title: 'Reminders that fire in local time', body: 'Service reminders send at 09:00 in the branch’s own timezone, by email and SMS.' },
              { icon: Car, title: 'History against the registration', body: 'Every past job on that vehicle is on one screen when the customer asks what you did last time.' },
            ]}
          />
          <ProductBlock
            title="Built for the person holding the spanner"
            lead="The job card opens on the phone in the bay, so the work gets updated where it happens. There is a native Android build on the Play Store too."
            image={{
              src: '/landing/03.webp',
              alt: 'A technician at an open bonnet reading the GaragePulse job card on a phone, with the status pipeline and vehicle details on screen.',
              width: 1448,
              height: 1086,
            }}
            points={[
              { icon: Wrench, title: 'Works on the floor', body: 'Assigned jobs, status updates and estimates from the bay, one-handed, without walking to the office PC.' },
              { icon: Users, title: 'Roles that mean something', body: 'Advisors quote, technicians work, receptionists book. Each role sees what it needs and nothing else.' },
              { icon: Building2, title: 'Switch branch without signing out', body: 'Owners move between branches from the app, and every screen re-scopes to the branch they picked.' },
            ]}
          />
        </div>
      </section>

      {/* ─── CAPABILITIES ─── */}
      <section id="capabilities" className="border-t border-bone-200 bg-bone-100">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            title="The whole workshop, not a slice of it"
            lead="Replacing a stack of tools only helps if nothing is left behind in the old ones."
          />
          <div className="mt-14 grid gap-x-16 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(c => (
              <CapabilityRow key={c.title} {...c} />
            ))}
          </div>
          <div className="mt-14 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login?register=true"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 px-7 py-4 text-base font-bold text-white transition-colors hover:bg-ink-800"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center justify-center border border-bone-400 px-7 py-4 text-base font-semibold text-gray-800 transition-colors hover:border-ink-900 hover:bg-bone-50"
            >
              Book a demo
            </a>
          </div>
        </div>
      </section>

      {/* ─── MULTI-BRANCH ─── */}
      <section id="branches" className="on-ink bg-ink-900 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-[2.75rem]">
              One garage or nine. One country or four.
            </h2>
            <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-white/70">
              Most workshop software assumes one shop in one country. GaragePulse treats the branch as the
              unit: data is isolated per branch, and every branch carries its own country.
            </p>
          </div>

          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              {
                icon: Building2,
                title: 'Branches are genuinely separate',
                body: 'Customers, vehicles, job cards, invoices and stock belong to a branch. Staff see their own branch; owners switch between them without signing out.',
              },
              {
                icon: Receipt,
                title: 'Local paperwork, automatically',
                body: 'Currency, tax name, tax rate, tax-ID label and date format resolve from the branch’s country. A UK branch prints VAT and GBP while an Indian branch prints GST and INR.',
              },
              {
                icon: Users,
                title: 'One team, one account',
                body: 'Add a branch, move staff between branches, or close one down, without a second subscription or a second login to remember.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-ink-900 p-8">
                <Icon className="h-6 w-6 text-accent-400" strokeWidth={1.75} />
                <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SUPPORT ─── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          title="Getting on to it is the part most software gets wrong"
          lead="Moving a workshop off paper and spreadsheets is a real job. We do that part with you."
        />
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {[
            { icon: DatabaseZap, title: 'We move your data', body: 'Send us the customer and vehicle records you already have, in whatever shape they are in, and we bring them across before you go live.' },
            { icon: LifeBuoy, title: 'A person answers', body: 'Support from people who know what a job card is, on the channels you already use.' },
            { icon: BookOpen, title: 'Guides for the whole team', body: 'Short walkthroughs for each role, so an advisor or a technician can be useful on day one.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t-2 border-gray-900 pt-6">
              <Icon className="h-6 w-6 text-gray-900" strokeWidth={1.75} />
              <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section id="security" className="border-t border-bone-200 bg-bone-100">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <SectionHeading
              title="Your customer list is your business. It stays yours."
              lead="A workshop's records are commercially sensitive: who owns what, what they paid, when they are due back."
            />
          </div>
          <ul className="flex flex-col">
            {[
              { icon: Lock, title: 'Encrypted in transit and at rest', body: 'Traffic runs over TLS, and stored data is encrypted by the infrastructure it sits on.' },
              { icon: KeyRound, title: 'Access scoped to a role and a branch', body: 'Every request is checked against the signed-in user’s role and their branch. A staff account cannot read another branch’s records.' },
              { icon: Fingerprint, title: 'Sessions that expire', body: 'Tokens are short-lived and idle sessions sign out, which matters on a shared machine at the counter.' },
              { icon: Shield, title: 'Deletion means deletion', body: 'Removing an account removes the records scoped to it, rather than hiding them behind a flag.' },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4 border-t border-bone-200 py-6 first:border-t-0 first:pt-0">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.75} />
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-gray-600">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── CLOSE ─── */}
      <section id="demo" className="on-ink bg-ink-900 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end lg:gap-20">
            <div>
              <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-[3rem]">
                See it against your own workshop.
              </h2>
              <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                Bring a real job you ran last week. We will set it up in GaragePulse on the call, in your
                currency and your tax rules, and you can decide from there.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                to="/login?register=true"
                className="group inline-flex items-center justify-center gap-2 bg-accent-500 px-7 py-4 text-base font-bold text-ink-900 transition-colors hover:bg-accent-400"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <a
                href="mailto:hello@garagepulse.com?subject=GaragePulse%20demo"
                className="inline-flex items-center justify-center border border-white/25 px-7 py-4 text-base font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-bone-200 bg-bone-50">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <img src="/mainIcon.png" alt="" className="h-7 w-7 object-contain" />
                <span className="font-display font-bold text-gray-900">GaragePulse</span>
              </div>
              <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-gray-500">
                Workshop management for independent garages, across branches and borders.
              </p>
              <div className="mt-6">
                <PlayStoreBadge />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Product</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm font-medium text-gray-600">
                {NAV_LINKS.map(l => (
                  <li key={l.href}>
                    <a href={l.href} className="transition-colors hover:text-primary-600">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Account</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm font-medium text-gray-600">
                <li><Link to="/login" className="transition-colors hover:text-primary-600">Sign in</Link></li>
                <li><Link to="/login?register=true" className="transition-colors hover:text-primary-600">Register</Link></li>
                <li>
                  <a href="mailto:hello@garagepulse.com" className="transition-colors hover:text-primary-600">Contact</a>
                </li>
              </ul>
            </div>
          </div>
          {/* The Play Store badge sits directly above this bar; a second line
              restating it in words was the third mention of the app on one page. */}
          <div className="mt-12 border-t border-bone-200 pt-6">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} GaragePulse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
