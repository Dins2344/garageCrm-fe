import { useState, useEffect, useRef, type ReactNode, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList, Users, Receipt, Package, Bell, BarChart3,
  CheckCircle, ArrowRight, Star, Zap, Shield, Clock, TrendingUp,
  Wrench, Car, FileText, ChevronDown, Phone, Mail,
  Building2, Globe, Award, Menu, X
} from 'lucide-react';
import { PLAY_STORE_URL, CARBON_FIBRE_TEXTURE_URL } from '../utils/constants';

/* ───── Scroll Reveal Hook ───── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

/* ───── Reveal Wrapper ───── */
interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
}

function Reveal({ children, delay = 0, direction = 'up', className = '' }: RevealProps) {
  const { ref, revealed } = useScrollReveal();

  const baseStyle = {
    opacity: revealed ? 1 : 0,
    transform: revealed
      ? 'none'
      : direction === 'up'
      ? 'translateY(32px)'
      : direction === 'left'
      ? 'translateX(-32px)'
      : 'translateX(32px)',
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  };

  return (
    <div ref={ref} style={baseStyle} className={className}>
      {children}
    </div>
  );
}

/* ───── Logo ───── */
function Logo({ size = 40 }: { size?: number }) {
  return <img src="/mainIcon.png" alt="GaragePulse Logo" style={{ width: size, height: size }} className="object-contain" />;
}

/* ───── Play Store ───── */
interface PlayStoreBadgeProps {
  /** `sm` for the footer, `md` for the hero. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Link to the Android app on Google Play, using the official badge artwork
 * from `public/playstore.png`.
 *
 * Opens in a new tab with `rel="noopener noreferrer"` — `noopener` is the
 * security-relevant half: without it the opened page gets a handle on
 * `window.opener` and can navigate this tab somewhere else.
 *
 * Sized by HEIGHT with `w-auto`: the asset is 582x220 (a 2.65:1 ratio), and
 * constraining one axis keeps Google's badge proportions intact. Never set
 * both — a stretched badge breaks their brand guidelines.
 *
 * `drop-shadow` rather than `shadow` on hover, because the PNG has
 * transparent corners; a box-shadow would draw a rectangle behind the rounded
 * badge, while drop-shadow follows the alpha channel.
 */
function PlayStoreBadge({ size = 'md', className = '' }: PlayStoreBadgeProps) {
  const isSmall = size === 'sm';
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download GaragePulse for Android on Google Play (opens in a new tab)"
      className={`inline-block transition-all duration-300 hover:scale-105 hover:drop-shadow-xl ${className}`}
    >
      <img
        src="/playstore.png"
        // Empty alt on purpose: the anchor's aria-label already names this
        // link, and a second description would be announced twice.
        alt=""
        className={`w-auto object-contain ${isSmall ? 'h-10' : 'h-14'}`}
      />
    </a>
  );
}

/* ───── Feature Card ───── */
interface FeatureCardProps {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  gradient: string;
  delay: number;
}

function FeatureCard({ icon: Icon, title, desc, gradient, delay }: FeatureCardProps) {
  return (
    <Reveal delay={delay}>
      <div className="group relative bg-white border border-gray-200/80 rounded-2xl p-7 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-7 h-7 text-primary-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

/* ───── Stat Item ───── */
interface StatItemProps {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

function StatItem({ value, label, icon: Icon }: StatItemProps) {
  return (
    <div className="text-center flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-1">
        <Icon className="w-6 h-6 text-primary-600" strokeWidth={1.5} />
      </div>
      <div className="text-4xl md:text-5xl font-extrabold text-primary-600">
        {value}
      </div>
      <div className="text-gray-500 text-sm font-medium">{label}</div>
    </div>
  );
}

/* ───── Workflow Step ───── */
interface StepCardProps {
  num: number;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  delay: number;
}

function StepCard({ num, icon: Icon, title, desc, delay }: StepCardProps) {
  return (
    <Reveal delay={delay}>
      <div className="flex flex-col items-center text-center group">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center text-[11px] font-extrabold text-primary-600">
            {num}
          </div>
        </div>
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-500 text-xs leading-relaxed max-w-[150px]">{desc}</p>
      </div>
    </Reveal>
  );
}

/* ───── Testimonial Card ───── */
interface TestimonialCardProps {
  name: string;
  garage: string;
  location: string;
  quote: string;
  rating: number;
  delay: number;
}

function TestimonialCard({ name, garage, location, quote, rating, delay }: TestimonialCardProps) {
  return (
    <Reveal delay={delay}>
      <div className="bg-white rounded-2xl border border-gray-200/80 p-7 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed flex-1 italic mb-6">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{name}</p>
            <p className="text-xs text-gray-400">{garage} · {location}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ───── Pricing Card ───── */
interface PricingCardProps {
  plan: string;
  price: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  delay: number;
}

function PricingCard({ plan, price, description, features, highlighted, cta, delay }: PricingCardProps) {
  return (
    <Reveal delay={delay}>
      <div className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${
        highlighted
          ? 'bg-gradient-to-br from-primary-600 to-purple-700 text-white shadow-2xl shadow-primary-500/30'
          : 'bg-white border border-gray-200/80 hover:shadow-xl'
      }`}>
        {highlighted && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-gray-900 text-xs font-extrabold rounded-full uppercase tracking-wider">
            Most Popular
          </div>
        )}
        <div className="mb-6">
          <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${highlighted ? 'text-primary-200' : 'text-primary-600'}`}>
            {plan}
          </p>
          <div className="flex items-end gap-1 mb-2">
            <span className={`text-4xl font-extrabold ${highlighted ? 'text-white' : 'text-gray-900'}`}>{price}</span>
            {price !== 'Free' && price !== 'Custom' && (
              <span className={`text-sm mb-1.5 ${highlighted ? 'text-primary-200' : 'text-gray-400'}`}>/month</span>
            )}
          </div>
          <p className={`text-sm ${highlighted ? 'text-primary-100' : 'text-gray-500'}`}>{description}</p>
        </div>

        <ul className="flex flex-col gap-3 flex-1 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? 'text-primary-200' : 'text-primary-500'}`} strokeWidth={2} />
              <span className={`text-sm ${highlighted ? 'text-primary-100' : 'text-gray-600'}`}>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/login?register=true"
          className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all duration-200 ${
            highlighted
              ? 'bg-white text-primary-700 hover:bg-primary-50 shadow-lg'
              : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
          }`}
        >
          {cta}
        </Link>
      </div>
    </Reveal>
  );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function HomePage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: ClipboardList,
      title: 'Job Card Management',
      desc: 'Track every vehicle from intake to delivery with an organized, status-driven workflow.',
      gradient: 'bg-gradient-to-br from-primary-50/80 to-blue-50/80',
    },
    {
      icon: Users,
      title: 'Customer CRM',
      desc: 'Maintain detailed customer and vehicle history for personalized, repeat service.',
      gradient: 'bg-gradient-to-br from-lime-50/80 to-green-50/80',
    },
    {
      icon: Receipt,
      title: 'Estimations & Invoices',
      desc: 'Generate professional, GST-ready estimations and invoices in seconds.',
      gradient: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/80',
    },
    {
      icon: Package,
      title: 'Inventory Control',
      desc: 'Real-time stock tracking with low-threshold alerts so you never run dry.',
      gradient: 'bg-gradient-to-br from-amber-50/80 to-orange-50/80',
    },
    {
      icon: Bell,
      title: 'Service Reminders',
      desc: 'Automated reminders keep customers coming back for timely maintenance.',
      gradient: 'bg-gradient-to-br from-rose-50/80 to-pink-50/80',
    },
    {
      icon: BarChart3,
      title: 'Insights Dashboard',
      desc: 'Revenue charts, active jobs, and KPI tracking — all at a glance.',
      gradient: 'bg-gradient-to-br from-cyan-50/80 to-sky-50/80',
    },
  ];

  const steps = [
    { icon: Car, title: 'Vehicle Intake', desc: 'Log customer & vehicle details instantly.' },
    { icon: FileText, title: 'Estimation', desc: 'Build parts + labor estimates, send for approval.' },
    { icon: Wrench, title: 'Repair & Track', desc: 'Assign mechanics, track progress live.' },
    { icon: Receipt, title: 'Invoice & Deliver', desc: 'Generate invoice, collect payment, deliver.' },
  ];

  const testimonials = [
    {
      name: 'Arjun Mehta',
      garage: 'Mehta Auto Works',
      location: 'Pune, MH',
      rating: 5,
      quote: "GaragePulse completely transformed how I run my workshop. Job cards that used to take 20 minutes now take 2. My customers love getting WhatsApp reminders too!",
    },
    {
      name: 'Priya Nair',
      garage: 'Nair Motors',
      location: 'Kochi, KL',
      rating: 5,
      quote: "The estimation and invoice module alone saved us from so many billing disputes. Professional, GST-ready invoices in literally seconds. Highly recommend!",
    },
    {
      name: 'Rajesh Gupta',
      garage: 'RG Service Centre',
      location: 'Jaipur, RJ',
      rating: 5,
      quote: "I manage 3 branches and the dashboard gives me a real-time view of all operations. The staff achievement board motivates my mechanics too!",
    },
  ];

  const pricingPlans = [
    {
      plan: 'Starter',
      price: 'Free',
      description: 'Perfect for small garages just getting started.',
      features: [
        'Up to 50 job cards/month',
        '1 user account',
        'Customer & vehicle records',
        'Basic invoicing',
        'Email support',
      ],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      plan: 'Professional',
      price: '₹1,499',
      description: 'The full GaragePulse experience for growing workshops.',
      features: [
        'Unlimited job cards',
        'Up to 10 staff accounts',
        'GST estimations & invoices',
        'Inventory management',
        'Automated service reminders',
        'Advanced dashboard & reports',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      plan: 'Enterprise',
      price: 'Custom',
      description: 'Multi-branch support and white-label solutions.',
      features: [
        'Unlimited everything',
        'Multi-branch management',
        'Custom branding & domain',
        'API access & integrations',
        'Dedicated account manager',
        '24/7 premium support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const whyReasons = [
    { icon: Zap, title: 'Lightning Fast Setup', desc: 'Go live in under 10 minutes. No installation, no IT team required.' },
    { icon: Shield, title: 'Secure & Reliable', desc: '99.9% uptime SLA with enterprise-grade data encryption at rest and in transit.' },
    { icon: Globe, title: 'Works Anywhere', desc: 'Cloud-based — access your garage from any device, browser, or location.' },
    { icon: TrendingUp, title: 'Grow with You', desc: 'From a single bay to multi-branch operations, GaragePulse scales seamlessly.' },
    { icon: Award, title: 'GST Compliant', desc: 'Auto-calculated GST on all estimations and invoices. Stay audit-ready.' },
    { icon: Clock, title: '24/7 Data Access', desc: 'Your job cards, invoices, and customer data — available round the clock.' },
  ];

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#why', label: 'Why Us' },
    { href: '#testimonials', label: 'Reviews' },
    { href: '#pricing', label: 'Pricing' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">

      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-gray-900/5 border-b border-gray-200/50'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <Logo size={36} />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Garage<span className="text-primary-600">Pulse</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:block px-5 py-2.5 rounded-xl text-gray-700 font-semibold text-sm hover:text-primary-600 hover:bg-gray-100 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?register=true"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-4 flex flex-col gap-3">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-primary-600 font-medium text-sm py-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
            {!user && (
              <Link
                to="/login"
                className="text-gray-700 font-medium text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-primary-400/20 to-purple-500/20 blur-3xl opacity-60" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-accent-400/15 to-blue-500/15 blur-3xl opacity-50" />
          <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-r from-emerald-400/10 to-primary-300/10 blur-3xl opacity-40" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Reveal delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              Built for modern garages
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
              Run your garage{' '}
              <span className="text-accent-600">
                like a pro
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
              GaragePulse is the all-in-one workshop management platform — from job cards and estimations
              to invoicing and inventory. Spend less time on paperwork, more time fixing cars.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/login?register=true"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                id="hero-cta"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-lg hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                See Features <ChevronDown className="w-5 h-5" />
              </a>
            </div>
          </Reveal>

          {/* Android app availability */}
          <Reveal delay={280}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 -mt-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Now live on Android — take your garage with you
              </div>
              <PlayStoreBadge />
            </div>
          </Reveal>

          {/* Floating trust badges */}
          <Reveal delay={320}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Setup in 10 minutes</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative z-10 max-w-5xl mx-auto -mt-4 mb-24 px-6">
        <Reveal>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-2xl shadow-gray-900/5 px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="500+" label="Garages Onboarded" icon={Building2} />
            <StatItem value="1.2M" label="Job Cards Created" icon={ClipboardList} />
            <StatItem value="99.9%" label="Uptime SLA" icon={Shield} />
            <StatItem value="4.9" label="Customer Rating" icon={Star} />
          </div>
        </Reveal>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-28">
        <Reveal>
          <div className="text-center mb-16">
            <p className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything your workshop needs
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              One platform to manage every aspect of your garage — from the moment a vehicle arrives to the moment it leaves.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} gradient={f.gradient} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ─── WHY GARAGEPULSE ─── */}
      <section id="why" className="bg-gradient-to-b from-gray-100/60 to-white py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">Why GaragePulse</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                The smarter way to run your workshop
              </h2>
              <p className="text-gray-500 mt-4 max-w-xl mx-auto">
                Ditch the spreadsheets and paper job cards. GaragePulse gives you everything you need to run a professional, efficient, and profitable garage.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: reasons grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {whyReasons.map((reason, i) => (
                <Reveal key={reason.title} delay={i * 70}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
                      <reason.icon className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{reason.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{reason.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Right: before/after comparison */}
            <Reveal direction="right">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  <div className="p-6 bg-red-50/40">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-red-500 mb-4">Before</p>
                    <ul className="flex flex-col gap-3 text-sm text-gray-600">
                      {[
                        'Paper job cards lost or illegible',
                        'Excel sheets for inventory',
                        'Manual GST calculations',
                        'No customer follow-ups',
                        'No visibility on revenue',
                        'Missed service due dates',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" strokeWidth={3} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-emerald-50/40">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 mb-4">After</p>
                    <ul className="flex flex-col gap-3 text-sm text-gray-600">
                      {[
                        'Digital job cards, tracked in real-time',
                        'Automated inventory alerts',
                        'GST invoices in one click',
                        'Auto WhatsApp & email reminders',
                        'Live revenue dashboard',
                        'Scheduled service reminders',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" strokeWidth={2} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-purple-50 border-t border-gray-100 text-center">
                  <p className="text-sm font-bold text-gray-700">Join <span className="text-primary-600">500+</span> garages already making the switch</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">Workflow</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Simplified in 4 steps
              </h2>
              <p className="text-gray-500 mt-4 max-w-lg mx-auto">
                From vehicle drop-off to payment — GaragePulse guides your team through every step of the service process.
              </p>
            </div>
          </Reveal>

          {/* Desktop: horizontal steps with connectors */}
          <div className="hidden md:flex items-start justify-center gap-0 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.title} className="flex items-start">
                <StepCard num={i + 1} icon={s.icon} title={s.title} desc={s.desc} delay={i * 100} />
                {i < steps.length - 1 && (
                  <div className="flex items-center self-start pt-8 mx-2">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-primary-300 to-purple-300 rounded-full" />
                    <ArrowRight className="w-4 h-4 text-primary-300 -ml-2" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical steps */}
          <div className="flex md:hidden flex-col items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center">
                <StepCard num={i + 1} icon={s.icon} title={s.title} desc={s.desc} delay={i * 100} />
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-8 bg-gradient-to-b from-primary-300 to-purple-300 rounded-full my-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="bg-gradient-to-b from-gray-100/60 to-white py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">Customer Stories</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Loved by garage owners across India
              </h2>
              <p className="text-gray-500 mt-4 max-w-xl mx-auto">
                Don't just take our word for it — hear from real workshops using GaragePulse every day.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} {...t} delay={i * 100} />
            ))}
          </div>
          <Reveal delay={300}>
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                4.9/5 average rating across 500+ garages
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-500 mt-4 max-w-xl mx-auto">
                Start free and scale as your garage grows. No hidden fees, no lock-in contracts.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <PricingCard key={plan.plan} {...plan} delay={i * 100} />
            ))}
          </div>
          <Reveal delay={300}>
            <p className="text-center text-gray-400 text-sm mt-8">
              All plans include a <strong className="text-gray-600">14-day free trial</strong>. No credit card required to start.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <Reveal>
          <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-12 md:p-16 text-center overflow-hidden">
            {/* Inline style, not a Tailwind arbitrary value: Tailwind's scanner only
                sees class strings written literally in source, so building
                `bg-[url(${VAR})]` dynamically emits no CSS at all. */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: `url('${CARBON_FIBRE_TEXTURE_URL}')` }}
            />
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-6">
                <Zap className="w-4 h-4 text-amber-400" />
                Get started in minutes
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
                Ready to transform your workshop?
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
                Join hundreds of garage owners who ditched spreadsheets and paper job cards for GaragePulse.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login?register=true"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold text-lg shadow-xl shadow-primary-500/40 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  id="cta-bottom"
                >
                  Get Started — It's Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white/80 font-semibold text-base hover:bg-white/10 transition-all duration-300"
                >
                  Sign In Instead
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Logo size={28} />
                <span className="font-bold text-gray-900">
                  Garage<span className="text-primary-600">Pulse</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                The all-in-one workshop management platform built for modern garages across India.
              </p>
              <div className="flex gap-4 mt-4 text-gray-400">
                <Phone className="w-4 h-4" />
                <Mail className="w-4 h-4" />
                <Globe className="w-4 h-4" />
              </div>
              <div className="mt-6">
                <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Get the app</p>
                <PlayStoreBadge size="sm" />
              </div>
            </div>

            {/* Product links */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-4">Product</p>
              <ul className="flex flex-col gap-2.5 text-sm font-medium text-gray-500">
                <li><a href="#features" className="hover:text-primary-600 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary-600 transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-primary-600 transition-colors">Reviews</a></li>
                <li><a href="#why" className="hover:text-primary-600 transition-colors">Why Us</a></li>
              </ul>
            </div>

            {/* Company links */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-4">Account</p>
              <ul className="flex flex-col gap-2.5 text-sm font-medium text-gray-500">
                <li><Link to="/login" className="hover:text-primary-600 transition-colors">Sign In</Link></li>
                <li><Link to="/login?register=true" className="hover:text-primary-600 transition-colors">Register</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} GaragePulse. All rights reserved.</p>
            <div className="flex gap-6 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
              <a href="#features" className="hover:text-primary-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
