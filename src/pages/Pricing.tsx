import { useEffect, useState } from 'react';
import { Check, Sparkles, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useGarage } from '../context/GarageContext';
import { getPlans } from '../services/apiServices/metaService';
import { formatMoney } from '../utils/format';
import type { PlanCatalog, PlanCatalogEntry, PlanId } from '../types/models';

type Period = 'monthly' | 'annual';

/**
 * The plan listing. Everything on it comes from `GET /meta/plans`: the
 * matrix, the prices in the garage's currency, and whether purchasing is
 * open. Today it is not — every owner is on Free — so the plan buttons show
 * the server's message instead of starting a checkout. When payments ship,
 * the server flips `purchasing.enabled` and this page gets a checkout
 * hand-off; nothing here hardcodes a price or a plan.
 */
export default function Pricing() {
  const { locale } = useGarage();
  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('monthly');
  const [notice, setNotice] = useState<string | null>(null);

  // Until subscriptions exist, every account is on Free.
  const currentPlan: PlanId = 'free';

  useEffect(() => {
    let cancelled = false;
    getPlans(locale.country)
      .then(res => { if (!cancelled) setCatalog(res.data); })
      .catch(() => { if (!cancelled) toast.error('Could not load plans'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [locale.country]);

  const handleChoose = (plan: PlanCatalogEntry) => {
    if (!catalog) return;
    if (!catalog.purchasing.enabled) {
      setNotice(catalog.purchasing.message);
      toast(catalog.purchasing.message, { icon: <Clock className="w-4 h-4" /> });
      return;
    }
    // Checkout hand-off lands here when purchasing is enabled.
    toast(`Checkout for ${plan.name} is not available yet`);
  };

  if (loading || !catalog) {
    return (
      <div className="flex justify-center py-24">
        <Loader />
      </div>
    );
  }

  const money = { locale: locale.locale, currency: catalog.currency };

  return (
    <div>
      <PageHeader title="Plans">
        <div className="inline-flex border border-bone-400" role="group" aria-label="Billing period">
          {(['monthly', 'annual'] as Period[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                period === p ? 'bg-ink-900 text-white' : 'bg-transparent text-gray-700 hover:bg-bone-100'
              }`}
            >
              {p === 'monthly' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>
      </PageHeader>

      {!catalog.purchasing.enabled && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 border border-warning/30 bg-warning-light px-5 py-4 text-sm text-warning-dark"
        >
          <Clock className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="font-semibold">Paid plans are coming soon</p>
            <p className="mt-0.5">{catalog.purchasing.message}</p>
          </div>
        </div>
      )}

      {period === 'annual' && (
        <p className="mb-4 text-sm text-gray-500">Annual billing is ten months for the price of twelve.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {catalog.plans.map(plan => {
          const isCurrent = plan.id === currentPlan;
          const highlighted = plan.id === 'plus';
          const price = plan.price[period];
          return (
            <section
              key={plan.id}
              aria-label={`${plan.name} plan`}
              className={`flex flex-col bg-bone-50 border p-6 ${
                highlighted ? 'border-ink-900' : 'border-bone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display text-xl font-bold text-gray-900">{plan.name}</h2>
                {isCurrent && <Badge intent="approved">Current plan</Badge>}
                {highlighted && !isCurrent && (
                  <Badge>
                    <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> Popular</span>
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-5">{plan.tagline}</p>

              <div className="mb-5">
                {price === 0 ? (
                  <p className="font-display text-3xl font-extrabold text-gray-900">Free</p>
                ) : (
                  <p className="font-display text-3xl font-extrabold text-gray-900">
                    {formatMoney(price, money)}
                    <span className="ml-1 text-sm font-medium text-gray-500">/ {period === 'monthly' ? 'month' : 'year'}</span>
                  </p>
                )}
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-success-dark" strokeWidth={3} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" disabled className="w-full">Your current plan</Button>
              ) : (
                <Button
                  variant={highlighted ? 'accent' : 'primary'}
                  className="w-full"
                  onClick={() => handleChoose(plan)}
                  aria-label={`Choose ${plan.name}`}
                >
                  Choose {plan.name}
                </Button>
              )}
            </section>
          );
        })}
      </div>

      {notice && (
        <p role="alert" className="mt-5 text-sm text-gray-600">{notice}</p>
      )}
    </div>
  );
}
