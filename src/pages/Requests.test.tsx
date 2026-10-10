import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Requests from './Requests';
import * as changeRequestService from '../services/apiServices/changeRequestService';
import type { ChangeRequest } from '../types/models';

vi.mock('../services/apiServices/changeRequestService');

const auth = vi.hoisted(() => ({ role: 'owner', id: 'u-owner' }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: auth.id, role: auth.role, name: 'Someone' },
    hasRole: (...roles: string[]) => roles.includes(auth.role),
    loading: false,
  }),
}));
vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return { useGarage: () => ({ locale: DEFAULT_LOCALE, activeGarageId: 'g1' }) };
});
vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({ withLoader: (fn: () => Promise<unknown>) => fn() }),
}));

const REQUEST: ChangeRequest = {
  _id: 'cr1', garage: 'g1', type: 'odometer_correction', status: 'pending', targetType: 'job_card',
  target: 'jc1', targetLabel: 'JC-261010-0001',
  payload: { odometerAtIntake: 12000, previousOdometer: 45200, remarks: 'Meter replaced' },
  requestedBy: { _id: 'u-mech', name: 'Ravi Kumar' }, decidedBy: null, decisionNote: '', decidedAt: null,
  createdAt: '2026-10-10T05:00:00Z', updatedAt: '2026-10-10T05:00:00Z',
};
const list = (data: ChangeRequest[]) => ({ success: true, count: data.length, total: data.length, pages: 1, currentPage: 1, data });

const renderAt = (path = '/requests') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/requests" element={<Requests />} /></Routes>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  auth.role = 'owner';
  auth.id = 'u-owner';
  vi.mocked(changeRequestService.getChangeRequests).mockResolvedValue(list([REQUEST]));
  vi.mocked(changeRequestService.getChangeRequest).mockResolvedValue({ success: true, data: REQUEST });
});

describe('Requests page', () => {
  it('opens on Pending for an owner and lists what is waiting', async () => {
    renderAt();
    expect(await screen.findByText('JC-261010-0001')).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(changeRequestService.getChangeRequests).toHaveBeenCalledWith({ status: 'pending', page: 1, limit: 10 });
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('shows staff their own requests with no tabs', async () => {
    auth.role = 'mechanic';
    renderAt();
    await screen.findByText('JC-261010-0001');
    expect(changeRequestService.getChangeRequests).toHaveBeenCalledWith({ status: undefined, page: 1, limit: 10 });
    expect(screen.queryByRole('button', { name: 'All' })).toBeNull();
  });

  it('lets an owner approve with a note, then reloads the list', async () => {
    vi.mocked(changeRequestService.approveChangeRequest).mockResolvedValue({ success: true, data: { ...REQUEST, status: 'approved' } });
    const user = userEvent.setup();
    renderAt('/requests?id=cr1');

    await user.type(await screen.findByLabelText('Note (optional)'), 'Looks right');
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(changeRequestService.approveChangeRequest).toHaveBeenCalledWith('cr1', 'Looks right'));
    await waitFor(() => expect(changeRequestService.getChangeRequests).toHaveBeenCalledTimes(2));
  });

  it('shows the reading change in the detail', async () => {
    renderAt('/requests?id=cr1');
    expect(await screen.findByText('45,200 km to 12,000 km')).toBeInTheDocument();
    expect(screen.getByText('Meter replaced')).toBeInTheDocument();
  });

  it('offers the requester Withdraw and nothing else', async () => {
    auth.role = 'mechanic';
    auth.id = 'u-mech';
    renderAt('/requests?id=cr1');
    expect(await screen.findByRole('button', { name: 'Withdraw Request' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
  });

  it('labels a type this build does not know', async () => {
    vi.mocked(changeRequestService.getChangeRequests).mockResolvedValue(list([{ ...REQUEST, type: 'price_override' }]));
    renderAt();
    expect(await screen.findByText('Change request')).toBeInTheDocument();
  });

  it('steps back a page when the page you were on has emptied', async () => {
    const user = userEvent.setup();
    vi.mocked(changeRequestService.getChangeRequests).mockImplementation(async (params) =>
      params?.page === 2
        ? { ...list([]), pages: 1, currentPage: 2 }
        : { ...list([REQUEST]), pages: 2 });
    renderAt();
    await screen.findByText('JC-261010-0001');
    await user.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(changeRequestService.getChangeRequests).toHaveBeenCalledWith({ status: 'pending', page: 2, limit: 10 }));
    await waitFor(() => expect(changeRequestService.getChangeRequests).toHaveBeenCalledTimes(3));
    expect(vi.mocked(changeRequestService.getChangeRequests).mock.calls[2][0]).toEqual({ status: 'pending', page: 1, limit: 10 });
  });
});
