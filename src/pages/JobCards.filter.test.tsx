import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import JobCards from './JobCards';
import * as jobCardService from '../services/apiServices/jobCardService';
import type { JobCard } from '../types/models';

vi.mock('../services/apiServices/jobCardService');
vi.mock('../services/apiServices/customerService');
vi.mock('../services/apiServices/vehicleService');
vi.mock('../services/apiServices/userService');

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'u1', role: 'owner', name: 'Owner' },
    hasRole: (...roles: string[]) => roles.includes('owner'),
    loading: false
  })
}));

vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({ withLoader: async (fn: () => Promise<unknown>) => fn() })
}));

vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return { useGarage: () => ({ locale: DEFAULT_LOCALE, activeGarageId: 'g1', garages: [] }) };
});

const card = (over: Partial<JobCard>): JobCard => ({
  _id: 'jc1', jobCardNumber: 'JC-260917-0001', status: 'new', serviceType: 'service',
  complaints: [], createdAt: '2026-09-17T00:00:00Z', ...over
} as unknown as JobCard);

const listResponse = (data: JobCard[]) => ({ success: true, count: data.length, total: data.length, pages: 1, currentPage: 1, data });

const lastListCall = () => vi.mocked(jobCardService.getJobCards).mock.calls.at(-1)![0];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(jobCardService.getJobCards).mockResolvedValue(listResponse([card({})]));
});

describe('JobCards — status filter', () => {
  it('lists everything by default, sending no status', async () => {
    render(<MemoryRouter><JobCards /></MemoryRouter>);

    await screen.findByText('JC-260917-0001');
    expect(lastListCall()).toMatchObject({ page: 1 });
    expect(lastListCall()!.status).toBeUndefined();
    expect(screen.getByRole('button', { name: /Status: All/ })).toBeInTheDocument();
  });

  it('sends the picked statuses comma-joined and refetches on each change', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><JobCards /></MemoryRouter>);
    await screen.findByText('JC-260917-0001');
    const initialCalls = vi.mocked(jobCardService.getJobCards).mock.calls.length;

    await user.click(screen.getByRole('button', { name: /Status: All/ }));
    await user.click(screen.getByRole('option', { name: 'New' }));
    await waitFor(() => expect(lastListCall()!.status).toBe('new'));

    await user.click(screen.getByRole('option', { name: 'In Progress' }));
    await waitFor(() => expect(lastListCall()!.status).toBe('new,in_progress'));
    expect(vi.mocked(jobCardService.getJobCards).mock.calls.length).toBeGreaterThanOrEqual(initialCalls + 2);

    // Deselecting drops it from the list rather than sending a blank.
    await user.click(screen.getByRole('option', { name: 'New' }));
    await waitFor(() => expect(lastListCall()!.status).toBe('in_progress'));
  });

  it('goes back to page 1 when the filter changes', async () => {
    const user = userEvent.setup();
    vi.mocked(jobCardService.getJobCards).mockResolvedValue({ ...listResponse([card({})]), pages: 3, total: 30 });
    render(<MemoryRouter><JobCards /></MemoryRouter>);
    await screen.findByText('JC-260917-0001');

    await user.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(lastListCall()!.page).toBe(2));

    await user.click(screen.getByRole('button', { name: /Status: All/ }));
    await user.click(screen.getByRole('option', { name: 'Delivered' }));
    await waitFor(() => expect(lastListCall()).toMatchObject({ status: 'delivered', page: 1 }));
  });

  it('explains an empty result as the filter, not an empty garage', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><JobCards /></MemoryRouter>);
    await screen.findByText('JC-260917-0001');

    vi.mocked(jobCardService.getJobCards).mockResolvedValue(listResponse([]));
    await user.click(screen.getByRole('button', { name: /Status: All/ }));
    await user.click(screen.getByRole('option', { name: 'Cancelled' }));

    expect(await screen.findByText('Try a different filter')).toBeInTheDocument();
  });
});
