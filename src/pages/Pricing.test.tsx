import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import Pricing from './Pricing';
import * as metaService from '../services/apiServices/metaService';
import type { PlanCatalog, ResolvedLocale } from '../types/models';

vi.mock('../services/apiServices/metaService');
vi.mock('react-hot-toast', () => {
  const fn = Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() });
  return { default: fn };
});

// The page prices in the garage's currency; the mock picks the country.
const garageLocale: ResolvedLocale = {
  country: 'AE', currency: 'AED', locale: 'en-AE', taxLabel: 'VAT', taxIdLabel: 'TRN',
  postalLabel: 'PO Box', postalInputMode: 'numeric', phoneExample: '050 123 4567', timezone: 'Asia/Dubai'
};

vi.mock('../context/GarageContext', () => ({
  useGarage: () => ({ locale: garageLocale })
}));

const catalog: PlanCatalog = {
  country: 'AE',
  currency: 'AED',
  purchasing: { enabled: false, message: 'Paid subscriptions will be enabled soon.' },
  plans: [
    {
      id: 'free', name: 'Free', tagline: 'Small garage.', features: ['2 branches'],
      limits: { maxGaragesPerOwner: 2, maxJobCardsPerGaragePerDay: 3, maxInvoicesPerGaragePerDay: 3, maxStaffPerGarage: 2 },
      price: { monthly: 0, annual: 0 }
    },
    {
      id: 'plus', name: 'Plus', tagline: 'Busy workshop.', features: ['3 branches', '10 job cards a day'],
      limits: { maxGaragesPerOwner: 3, maxJobCardsPerGaragePerDay: 10, maxInvoicesPerGaragePerDay: 10, maxStaffPerGarage: 8 },
      price: { monthly: 49, annual: 490 }
    },
    {
      id: 'pro', name: 'Pro', tagline: 'Multi-branch.', features: ['10 branches'],
      limits: { maxGaragesPerOwner: 10, maxJobCardsPerGaragePerDay: null, maxInvoicesPerGaragePerDay: null, maxStaffPerGarage: null },
      price: { monthly: 99, annual: 990 }
    }
  ]
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(metaService.getPlans).mockResolvedValue({ success: true, data: catalog });
});

describe('Pricing', () => {
  it('asks the API for the garage country and lists the three plans priced in its currency', async () => {
    render(<Pricing />);

    expect(await screen.findByRole('region', { name: 'Plus plan' })).toBeInTheDocument();
    expect(metaService.getPlans).toHaveBeenCalledWith('AE');

    expect(screen.getByRole('region', { name: 'Free plan' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Pro plan' })).toBeInTheDocument();

    const plus = screen.getByRole('region', { name: 'Plus plan' });
    expect(within(plus).getByText(/AED\s?49\.00/)).toBeInTheDocument();
    expect(within(plus).getByText('10 job cards a day')).toBeInTheDocument();
    const pro = screen.getByRole('region', { name: 'Pro plan' });
    expect(within(pro).getByText(/AED\s?99\.00/)).toBeInTheDocument();
  });

  it('marks Free as the current plan and gives it no upgrade button', async () => {
    render(<Pricing />);
    const free = await screen.findByRole('region', { name: 'Free plan' });

    expect(within(free).getByText('Current plan')).toBeInTheDocument();
    expect(within(free).getByRole('button', { name: 'Your current plan' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Choose Free' })).not.toBeInTheDocument();
  });

  it('shows the coming-soon notice and, on choosing a plan, the server message instead of a checkout', async () => {
    const user = userEvent.setup();
    render(<Pricing />);
    await screen.findByRole('region', { name: 'Plus plan' });

    expect(screen.getByRole('status')).toHaveTextContent('Paid subscriptions will be enabled soon.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Choose Plus' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Paid subscriptions will be enabled soon.');
    expect(toast).toHaveBeenCalledWith('Paid subscriptions will be enabled soon.', expect.anything());
    // Nothing else was asked of the API — no order, no checkout.
    expect(metaService.getPlans).toHaveBeenCalledTimes(1);
  });

  it('switches to annual prices with the toggle', async () => {
    const user = userEvent.setup();
    render(<Pricing />);
    await screen.findByRole('region', { name: 'Plus plan' });

    await user.click(screen.getByRole('button', { name: 'Annual' }));

    const plus = screen.getByRole('region', { name: 'Plus plan' });
    expect(within(plus).getByText(/AED\s?490\.00/)).toBeInTheDocument();
    expect(within(plus).getByText('/ year')).toBeInTheDocument();
  });

  it('reports a failed catalog load', async () => {
    vi.mocked(metaService.getPlans).mockRejectedValue(new Error('down'));
    render(<Pricing />);

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not load plans'));
    expect(screen.queryByRole('region', { name: 'Plus plan' })).not.toBeInTheDocument();
  });
});
