import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';
import * as garageService from '../services/apiServices/garageService';
import * as userService from '../services/apiServices/userService';
import * as authService from '../services/apiServices/authService';
import type { Garage, User } from '../types/models';

vi.mock('../services/apiServices/garageService');
vi.mock('../services/apiServices/userService');
vi.mock('../services/apiServices/authService');

const authState: { user: User; logout: ReturnType<typeof vi.fn> } = { user: {} as User, logout: vi.fn() };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    hasRole: (...roles: string[]) => roles.includes(authState.user.role),
    user: authState.user,
    loading: false,
    refreshUser: vi.fn(),
    logout: authState.logout
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
      refreshGarage: vi.fn(), switchGarage: vi.fn(), addBranch: vi.fn(), removeBranch: vi.fn()
    })
  };
});

vi.mock('../hooks/useCountries', () => ({
  useCountries: () => ({ countries: [], loading: false })
}));

const person = (role: User['role']): User => ({
  _id: 'u1', name: 'Dinson', email: 'me@example.com', phone: '9876543210', role,
  garage: 'g1', isActive: true, emailVerifiedAt: null, phoneVerifiedAt: null
});

const sampleGarage = {
  _id: 'g1', name: 'Speed Auto Works', phone: '9876543210', email: '', gstNumber: '', country: 'IN',
  settings: { taxRate: 18, laborRatePerHour: 500, serviceReminderDays: 180, timezone: '' },
  address: { street: '', city: '', state: '', pincode: '' }
} as unknown as Garage;

const renderSettings = () => render(<MemoryRouter><Settings /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  authState.logout.mockResolvedValue(undefined);
  vi.mocked(garageService.getGarage).mockResolvedValue({ success: true, data: sampleGarage } as never);
  vi.mocked(garageService.getBranchStaff).mockResolvedValue({ success: true, data: [] } as never);
  vi.mocked(userService.getUsers).mockResolvedValue({ success: true, data: [] } as never);
  vi.mocked(authService.deleteAccount).mockResolvedValue({ success: true, message: 'Your account has been deleted' });
});

describe('Settings — delete account', () => {
  it('needs the password before it will delete, and signs out once the server has', async () => {
    authState.user = person('owner');
    const user = userEvent.setup();
    renderSettings();

    await user.click(await screen.findByRole('button', { name: 'Delete my account' }));
    const dialog = screen.getByRole('dialog');
    // Owners are told the whole garage goes.
    expect(within(dialog).getByText(/Every branch you own will be deleted/)).toBeInTheDocument();

    const confirmBtn = within(dialog).getByRole('button', { name: 'Delete my account' });
    expect(confirmBtn).toBeDisabled();
    expect(authService.deleteAccount).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText('Enter your password to confirm'), 'hunter22');
    expect(confirmBtn).toBeEnabled();
    await user.click(confirmBtn);

    await waitFor(() => expect(authService.deleteAccount).toHaveBeenCalledWith('hunter22'));
    await waitFor(() => expect(authState.logout).toHaveBeenCalled());
  });

  it('shows the server message on a wrong password and keeps the account', async () => {
    authState.user = person('mechanic');
    vi.mocked(authService.deleteAccount).mockRejectedValue({ response: { data: { message: 'Password is incorrect' } } });
    const user = userEvent.setup();
    renderSettings();

    await user.click(await screen.findByRole('button', { name: 'Delete my account' }));
    const dialog = screen.getByRole('dialog');
    // Staff are told only their login goes.
    expect(within(dialog).getByText(/Your login will be removed/)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Enter your password to confirm'), 'wrong');
    await user.click(within(dialog).getByRole('button', { name: 'Delete my account' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Password is incorrect');
    expect(authState.logout).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('button', { name: 'Delete my account' })).toBeEnabled();
  });

  it('can be backed out of without calling the API', async () => {
    authState.user = person('owner');
    const user = userEvent.setup();
    renderSettings();

    await user.click(await screen.findByRole('button', { name: 'Delete my account' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Keep my account' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(authService.deleteAccount).not.toHaveBeenCalled();
  });
});
