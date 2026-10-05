import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JobCardDetail from './JobCardDetail';
import * as jobCardService from '../services/apiServices/jobCardService';
import * as userService from '../services/apiServices/userService';
import type { JobCard, User } from '../types/models';

vi.mock('../services/apiServices/jobCardService');
vi.mock('../services/apiServices/userService');
vi.mock('../services/apiServices/garageService');
vi.mock('../services/apiServices/invoiceService');

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'u1', role: 'owner', name: 'Owner' },
    hasRole: (...roles: string[]) => roles.includes('owner'),
    loading: false
  })
}));

// Records whether the app-wide loader was up while a call was in flight.
const loader = vi.hoisted(() => ({ active: false, calls: 0 }));
vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({
    withLoader: async (fn: () => Promise<unknown>) => {
      loader.calls++;
      loader.active = true;
      try { return await fn(); } finally { loader.active = false; }
    }
  })
}));

vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return { useGarage: () => ({ locale: DEFAULT_LOCALE, activeGarageId: 'g1', activeGarage: null, garages: [] }) };
});

const MECHANICS = [
  { _id: 'm1', name: 'Ravi Kumar', role: 'mechanic' },
  { _id: 'm2', name: 'Anil Joseph', role: 'mechanic' }
] as User[];

const jobCard = {
  _id: 'jc1', jobCardNumber: 'JC-261005-0001', status: 'in_progress', serviceType: 'service',
  odometerAtIntake: 42500, complaints: [], createdAt: '2026-10-05T00:00:00Z',
  customer: { _id: 'c1', name: 'Rahul', phone: '9876543210' },
  vehicle: { _id: 'v1', licensePlate: 'KL07AB1234', make: 'Maruti', model: 'Swift' },
  assignedMechanic: { _id: 'm1', name: 'Ravi Kumar' },
  statusHistory: [{ status: 'new', changedAt: '2026-10-05T04:00:00Z', notes: 'Job card created' }],
  estimation: { parts: [], labor: [], subtotal: 0, taxRate: 0, taxAmount: 0, discount: 0, grandTotal: 0, approvedByCustomer: false }
} as unknown as JobCard;

const renderPage = async () => {
  render(
    <MemoryRouter initialEntries={['/jobcards/jc1']}>
      <Routes><Route path="/jobcards/:id" element={<JobCardDetail />} /></Routes>
    </MemoryRouter>
  );
  return screen.findByRole('combobox', { name: 'Assigned mechanic' });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(jobCardService.getJobCard).mockResolvedValue({ success: true, data: jobCard });
  vi.mocked(userService.getMechanics).mockResolvedValue(MECHANICS);
});

describe('JobCardDetail — mechanic assignment', () => {
  beforeEach(() => {
    loader.calls = 0;
  });

  it('runs the change and the refetch under the app-wide loader, like a status change', async () => {
    const loaderUpDuring: boolean[] = [];
    vi.mocked(jobCardService.updateJobCard).mockImplementation(async () => {
      loaderUpDuring.push(loader.active);
      return { success: true, data: jobCard };
    });
    const user = userEvent.setup();
    const select = await renderPage();
    await screen.findByRole('option', { name: 'Anil Joseph' });
    vi.mocked(jobCardService.getJobCard).mockImplementation(async () => {
      loaderUpDuring.push(loader.active);
      return { success: true, data: jobCard };
    });

    await user.selectOptions(select, 'm2');

    await waitFor(() => expect(loaderUpDuring).toEqual([true, true]));
    expect(loader.calls).toBe(1);
    expect(jobCardService.updateJobCard).toHaveBeenCalledWith('jc1', { assignedMechanic: 'm2' });
  });

  it('uses the loader when unassigning too', async () => {
    vi.mocked(jobCardService.updateJobCard).mockResolvedValue({ success: true, data: jobCard });
    const user = userEvent.setup();
    const select = await renderPage();

    await user.selectOptions(select, '');

    await waitFor(() => expect(jobCardService.updateJobCard).toHaveBeenCalledWith('jc1', { assignedMechanic: '' }));
    expect(loader.calls).toBe(1);
  });
});

describe('JobCardDetail — timeline names', () => {
  it("shows the server's name for each entry and never a made-up one", async () => {
    vi.mocked(jobCardService.getJobCard).mockResolvedValue({
      success: true,
      data: {
        ...jobCard,
        statusHistory: [
          { status: 'new', changedAt: '2026-10-05T04:00:00Z', notes: 'Job card created', changedBy: { _id: 'u1', name: 'Dinson' } },
          { status: 'approved', changedAt: '2026-10-05T05:00:00Z', notes: 'Estimation approved by customer via approval link', changedBy: { _id: '', name: 'Customer' } },
          { status: 'in_progress', changedAt: '2026-10-05T06:00:00Z', notes: 'Started', changedBy: { _id: 'gone', name: 'Former staff member' } },
          { status: 'in_progress', changedAt: '2026-10-05T07:00:00Z', notes: 'No one recorded', changedBy: null }
        ]
      } as unknown as JobCard
    });
    await renderPage();

    expect(await screen.findByText(/by Dinson$/)).toBeInTheDocument();
    expect(screen.getByText(/by Customer$/)).toBeInTheDocument();
    expect(screen.getByText(/by Former staff member$/)).toBeInTheDocument();
    expect(screen.queryByText(/by Staff/)).not.toBeInTheDocument();
  });
});
