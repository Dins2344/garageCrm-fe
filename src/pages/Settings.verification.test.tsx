import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';
import * as garageService from '../services/apiServices/garageService';
import * as userService from '../services/apiServices/userService';
import * as authService from '../services/apiServices/authService';
import type { Garage, User } from '../types/models';

// The Plan card links to /pricing, so the page needs a router around it.
const renderSettings = () => render(<MemoryRouter><Settings /></MemoryRouter>);

vi.mock('../services/apiServices/garageService');
vi.mock('../services/apiServices/userService');
vi.mock('../services/apiServices/authService');

// The card is driven by `user.*VerifiedAt`; the mock lets each test choose the
// starting state and observe `refreshUser` being asked to pick up the change.
const authState: { user: User; refreshUser: ReturnType<typeof vi.fn> } = {
  user: {} as User,
  refreshUser: vi.fn()
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    hasRole: (...roles: string[]) => roles.includes(authState.user.role),
    user: authState.user,
    loading: false,
    refreshUser: authState.refreshUser
  })
}));

vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({ withLoader: async (fn: () => Promise<unknown>) => fn() })
}));

vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return {
    useGarage: () => ({
      garages: [], activeGarageId: 'g1', activeGarageName: 'Test Garage',
      activeGarage: null, locale: DEFAULT_LOCALE,
      refreshGarage: vi.fn(), switchGarage: vi.fn(),
      addBranch: vi.fn(), removeBranch: vi.fn()
    })
  };
});

vi.mock('../hooks/useCountries', () => ({
  useCountries: () => ({
    countries: [
      { code: 'IN', name: 'India', currency: 'INR', taxLabel: 'GST', taxIdLabel: 'GSTIN', postalLabel: 'Pincode', postalInputMode: 'numeric', phoneExample: '98765 43210', requiresTimezoneChoice: false }
    ],
    loading: false
  })
}));

const owner = (over: Partial<User> = {}): User => ({
  _id: 'u1', name: 'Dinson', email: 'owner@example.com', phone: '9876543210', role: 'owner',
  garage: 'g1', isActive: true, emailVerifiedAt: null, phoneVerifiedAt: null, ...over
});

const sampleGarage = {
  _id: 'g1', name: 'Speed Auto Works', phone: '9876543210', email: '', gstNumber: '', country: 'IN',
  settings: { taxRate: 18, laborRatePerHour: 500, serviceReminderDays: 180, timezone: '' },
  address: { street: '', city: '', state: '', pincode: '' }
} as unknown as Garage;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(garageService.getGarage).mockResolvedValue({ success: true, data: sampleGarage } as never);
  vi.mocked(garageService.getBranchStaff).mockResolvedValue({ success: true, data: [] } as never);
  vi.mocked(userService.getUsers).mockResolvedValue({ success: true, data: [] } as never);
  vi.mocked(authService.sendVerificationCode).mockResolvedValue({
    success: true,
    data: { status: 'sent', channel: 'email', target: 'o***r@example.com', expiresInSeconds: 600, resendAfterSeconds: 60 }
  });
  vi.mocked(authService.confirmVerificationCode).mockResolvedValue({ success: true, data: owner({ emailVerifiedAt: '2026-09-14T00:00:00Z' }) });
});

const card = async () => {
  const heading = await screen.findByText('Verification');
  return within(heading.closest('[id="verification"]') as HTMLElement);
};

describe('Settings — owner verification card', () => {
  it('shows both channels as not verified for a fresh owner', async () => {
    authState.user = owner();
    renderSettings();

    const c = await card();
    expect(c.getAllByText('Not verified')).toHaveLength(2);
    expect(c.getByRole('button', { name: 'Verify email' })).toBeInTheDocument();
    expect(c.getByRole('button', { name: 'Verify phone' })).toBeInTheDocument();
  });

  it('shows Verified and hides the button for a verified channel', async () => {
    authState.user = owner({ emailVerifiedAt: '2026-09-01T00:00:00Z' });
    renderSettings();

    const c = await card();
    expect(c.getByText('Verified')).toBeInTheDocument();
    expect(c.getByText('Not verified')).toBeInTheDocument();
    expect(c.queryByRole('button', { name: 'Verify email' })).not.toBeInTheDocument();
    expect(c.getByRole('button', { name: 'Verify phone' })).toBeInTheDocument();
  });

  it('is not rendered for staff', async () => {
    authState.user = owner({ role: 'mechanic' });
    renderSettings();

    await screen.findByText('Edit My Profile');
    expect(screen.queryByText('Verification')).not.toBeInTheDocument();
  });

  it('sends the code on open, confirms what was typed, and refreshes the user', async () => {
    authState.user = owner();
    const user = userEvent.setup();
    renderSettings();

    await user.click((await card()).getByRole('button', { name: 'Verify email' }));

    await waitFor(() => expect(authService.sendVerificationCode).toHaveBeenCalledWith('email'));
    expect(await screen.findByText('o***r@example.com')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('123456');
    await user.type(input, '48 29 13');
    expect(input).toHaveValue('482913');

    await user.click(screen.getByRole('button', { name: /^Verify$/ }));

    await waitFor(() => expect(authService.confirmVerificationCode).toHaveBeenCalledWith('email', '482913'));
    await waitFor(() => expect(authState.refreshUser).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Verify your email')).not.toBeInTheDocument());
  });

  it('surfaces the server message when a code is wrong', async () => {
    authState.user = owner();
    vi.mocked(authService.confirmVerificationCode).mockRejectedValueOnce({
      response: { data: { message: 'Incorrect code. 4 attempts remaining' } }
    });
    const user = userEvent.setup();
    renderSettings();

    await user.click((await card()).getByRole('button', { name: 'Verify phone' }));
    await screen.findByText('o***r@example.com');
    await user.type(screen.getByPlaceholderText('123456'), '000000');
    await user.click(screen.getByRole('button', { name: /^Verify$/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect code. 4 attempts remaining');
    expect(authState.refreshUser).not.toHaveBeenCalled();
  });

  it('shows the cooldown message when sending is refused', async () => {
    authState.user = owner();
    vi.mocked(authService.sendVerificationCode).mockRejectedValueOnce({
      response: { data: { message: 'Please wait a minute before requesting another code' } }
    });
    const user = userEvent.setup();
    renderSettings();

    await user.click((await card()).getByRole('button', { name: 'Verify email' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait a minute before requesting another code');
    // Nothing to type into until a code is actually on its way.
    expect(screen.getByPlaceholderText('123456')).toBeDisabled();
  });
});
