import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ───── tiny reusable logo SVG ───── */
function Logo({ size = 40, id = 'logo' }) {
  return (
    // <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
    //   <rect width="40" height="40" rx="10" fill={`url(#${id})`} />
    //   <path d="M12 28V17L20 12L28 17V28L20 23L12 28Z" fill="white" fillOpacity="0.9" />
    //   <path d="M20 12V23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    //   <defs>
    //     <linearGradient id={id} x1="0" y1="0" x2="40" y2="40">
    //       <stop stopColor="#3B5FF8" />
    //       <stop offset="1" stopColor="#7C3AED" />
    //     </linearGradient>
    //   </defs>
    // </svg>
    // Image component
    <img src="/GPfavi.png" alt="GaragePulse Logo" className="w-10" />
  );
}


/* ───── Feature card ───── */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div
      className="group relative bg-white/70 backdrop-blur-lg border border-gray-200/60 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/15 to-purple-500/15 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ───── Stat counter ───── */
function StatItem({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-gray-500 text-sm mt-2 font-medium">{label}</div>
    </div>
  );
}

/* ───── Workflow step ───── */
function StepBadge({ num, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center max-w-[180px]">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-primary-500/30 mb-3">
        {num}
      </div>
      <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
      <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function HomePage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: '📋', title: 'Job Card Management', desc: 'Track every vehicle from intake to delivery with an organized, status-driven workflow.' },
    { icon: '👥', title: 'Customer CRM', desc: 'Maintain detailed customer and vehicle history for personalized, repeat service.' },
    { icon: '💰', title: 'Estimations & Invoices', desc: 'Generate professional, GST-ready estimations and invoices in seconds.' },
    { icon: '📦', title: 'Inventory Control', desc: 'Real-time stock tracking with low-threshold alerts so you never run dry.' },
    { icon: '🔔', title: 'Service Reminders', desc: 'Automated reminders keep customers coming back for timely maintenance.' },
    { icon: '📊', title: 'Insights Dashboard', desc: 'Revenue charts, active jobs, and KPI tracking — all at a glance.' },
  ];

  const steps = [
    { title: 'Vehicle Intake', desc: 'Log customer & vehicle details instantly.' },
    { title: 'Estimation', desc: 'Build parts + labor estimates, send for approval.' },
    { title: 'Repair & Track', desc: 'Assign mechanics, track progress live.' },
    { title: 'Invoice & Deliver', desc: 'Generate invoice, collect payment, deliver.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">

      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-gray-900/5 border-b border-gray-200/50'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <Logo size={36} id="nav_logo" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Garage<span className="text-primary-600">Pulse</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl text-gray-700 font-semibold text-sm hover:text-primary-600 hover:bg-gray-100 transition-all duration-200"
                >
                  Sign In
                </Link>
                {/* <Link
                  to="/login?register=true"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Get Started Free
                </Link> */}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-primary-400/20 to-purple-500/20 blur-3xl opacity-60" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-accent-400/15 to-blue-500/15 blur-3xl opacity-50" />
          <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-r from-emerald-400/10 to-primary-300/10 blur-3xl opacity-40" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            Built for modern garages
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Run your garage{' '}
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-accent-500 bg-clip-text text-transparent">
              like a pro
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            GaragePulse is the all-in-one workshop management platform — from job cards and estimations
            to invoicing and inventory. Spend less time on paperwork, more time fixing cars.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login?register=true"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              id="hero-cta"
            >
              Start Free Trial →
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-lg hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-300"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative z-10 max-w-4xl mx-auto -mt-4 mb-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-900/5 px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value="500+" label="Garages Onboarded" />
          <StatItem value="1.2M" label="Job Cards Created" />
          <StatItem value="99.9%" label="Uptime SLA" />
          <StatItem value="4.9★" label="Customer Rating" />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <p className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Everything your workshop needs
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-gradient-to-b from-gray-100/80 to-gray-50 py-24 px-6">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <p className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-3">Workflow</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Simplified in 4 steps
          </h2>
        </div>

        {/* Desktop: horizontal steps with connectors */}
        <div className="hidden md:grid max-w-4xl mx-auto items-start" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr' }}>
          {steps.map((s, i) => (
            <>
              <StepBadge key={s.title} num={i + 1} title={s.title} desc={s.desc} />
              {i < steps.length - 1 && (
                <div key={`line-${i}`} className="flex items-center self-start pt-5">
                  <div className="w-12 lg:w-20 h-0.5 bg-gradient-to-r from-primary-300 to-purple-300 rounded-full" />
                </div>
              )}
            </>
          ))}
        </div>

        {/* Mobile: vertical steps with connectors */}
        <div className="flex md:hidden flex-col items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-col items-center">
              <StepBadge num={i + 1} title={s.title} desc={s.desc} />
              {i < steps.length - 1 && (
                <div className="w-0.5 h-8 bg-gradient-to-b from-primary-300 to-purple-300 rounded-full mt-3" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              Ready to transform your workshop?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
              Join hundreds of garage owners who ditched spreadsheets and paper job cards for GaragePulse.
            </p>
            <Link
              to="/login?register=true"
              className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold text-lg shadow-xl shadow-primary-500/40 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              id="cta-bottom"
            >
              Get Started — It's Free
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={28} id="footer_logo" />
            <span className="font-bold text-gray-900">
              Garage<span className="text-primary-600">Pulse</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} GaragePulse. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <Link to="/login" className="hover:text-primary-600 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
