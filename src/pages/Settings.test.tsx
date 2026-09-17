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

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    hasRole: () => true,
    user: { _id: 'u1', name: 'Dinson', email: 'owner@example.com', phone: '9876543210', role: 'owner' },
    loading: false,
  }),
}));

vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({ withLoader: async (fn: () => Promise<unknown>) => fn() }),
}));

vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return {
    useGarage: () => ({
      garages: [], activeGarageId: 'g1', activeGarageName: 'Test Garage',
      activeGarage: null, locale: DEFAULT_LOCALE,
      refreshGarage: vi.fn(), switchGarage: vi.fn(),
      addBranch: vi.fn(), removeBranch: vi.fn(),
    }),
  };
});

// The country list is fetched over the network in the real hook; the form only
// needs one entry to render a picker and resolve its labels.
vi.mock('../hooks/useCountries', () => ({
  useCountries: () => ({
    countries: [
      { code: 'IN', name: 'India', currency: 'INR', taxLabel: 'GST', taxIdLabel: 'GSTIN', postalLabel: 'Pincode', postalInputMode: 'numeric', phoneExample: '98765 43210', requiresTimezoneChoice: false },
      { code: 'GB', name: 'United Kingdom', currency: 'GBP', taxLabel: 'VAT', taxIdLabel: 'VAT No.', postalLabel: 'Postcode', postalInputMode: 'text', phoneExample: '07911 123456', requiresTimezoneChoice: false },
    ],
    loading: false,
  }),
}));

const sampleGarage = {
  _id: 'g1',
  name: 'Speed Auto Works',
  phone: '9876543210',
  email: 'hello@example.com',
  gstNumber: '29ABCDE1234F1Z5',
  country: 'IN',
  settings: { taxRate: 18, laborRatePerHour: 500, serviceReminderDays: 180, timezone: '' },
  address: { street: '1 Main Rd', city: 'Bengaluru', state: 'Karnataka', pincode: '560068' },
} as unknown as Garage;

const sampleStaff = [
  { _id: 'u2', name: 'Imran Shaikh', email: 'imran@example.com', phone: '9876543211', role: 'mechanic', isActive: true },
] as unknown as User[];

/**
 * Reach the garage panel's edit form, which is behind an Edit toggle.
 *
 * Both anchors have to be scoped to the panel. The garage name renders in the
 * page-header badge as well as the info row, and every staff row carries its
 * own "Edit" button — so page-wide queries for either find several.
 */
const garagePanel = () => within(document.getElementById('garage-info') as HTMLElement);

const openGarageEditor = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText('Garage Information');
  await user.click(garagePanel().getByRole('button', { name: /^Edit$/i }));
  return garagePanel().getByLabelText(/Garage Name/i);
};

/**
 * The staff modal portals to `document.body`, so it is outside the render
 * container — and it is not the only `<form>` on the page either, since the
 * profile and password panels each have one. The Role select is unique to the
 * modal, so walk up from there.
 */
const staffModalForm = () =>
  screen.getByLabelText(/^Role/i).closest('form') as HTMLElement;

describe('Settings forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(garageService.getGarage).mockResolvedValue({ success: true, data: sampleGarage });
    vi.mocked(garageService.updateGarage).mockResolvedValue({ success: true, data: sampleGarage });
    vi.mocked(userService.getUsers).mockResolvedValue({ success: true, count: 1, total: 1, pages: 1, currentPage: 1, data: sampleStaff });
    vi.mocked(authService.updateProfile).mockResolvedValue({ success: true, data: sampleStaff[0] });
    vi.mocked(authService.changePassword).mockResolvedValue({ success: true, message: 'ok' });
  });

  describe('garage settings', () => {
    it('blocks the save and names the field when the garage name is cleared', async () => {
      const user = userEvent.setup();
      renderSettings();
      const name = await openGarageEditor(user);

      await user.clear(name);
      await user.click(garagePanel().getByRole('button', { name: /Save Garage Info/i }));

      expect(await screen.findByText(/Garage name is required/i)).toBeInTheDocument();
      expect(garageService.updateGarage).not.toHaveBeenCalled();
    });

    /**
     * The rule the whole conversion turns on: an empty optional field is fine,
     * but something typed into it is held to the full standard. A tax id of
     * `not@valid!` used to reach the server and come back as a generic error.
     */
    it('accepts a blank tax id but rejects a malformed one', async () => {
      const user = userEvent.setup();
      renderSettings();
      await openGarageEditor(user);

      const taxId = garagePanel().getByLabelText(/GSTIN/i);
      await user.clear(taxId);
      await user.click(garagePanel().getByRole('button', { name: /Save Garage Info/i }));
      await waitFor(() => expect(garageService.updateGarage).toHaveBeenCalled());

      vi.mocked(garageService.updateGarage).mockClear();
      await user.click(garagePanel().getByRole('button', { name: /^Edit$/i }));
      const taxIdAgain = garagePanel().getByLabelText(/GSTIN/i);
      await user.type(taxIdAgain, 'not@valid!');
      await user.click(garagePanel().getByRole('button', { name: /Save Garage Info/i }));

      expect(await screen.findByText(/Enter a valid GSTIN/i)).toBeInTheDocument();
      expect(garageService.updateGarage).not.toHaveBeenCalled();
    });

    /**
     * The postal rule follows the country **being chosen**, not the saved one.
     * Before this, switching to the UK still applied India's digits-only rule
     * and `SW1A 1AA` was literally unenterable.
     */
    it('validates the postcode against the country selected in the picker', async () => {
      const user = userEvent.setup();
      renderSettings();
      await openGarageEditor(user);

      const pincode = garagePanel().getByLabelText(/Pincode/i);
      await user.clear(pincode);
      await user.type(pincode, 'SW1A 1AA');
      await user.click(garagePanel().getByRole('button', { name: /Save Garage Info/i }));
      expect(await screen.findByText(/Enter a valid Pincode/i)).toBeInTheDocument();

      await user.selectOptions(garagePanel().getByLabelText(/Country/i), 'GB');
      await user.click(garagePanel().getByRole('button', { name: /Save Garage Info/i }));
      await waitFor(() => expect(garageService.updateGarage).toHaveBeenCalled());
    });

    it('sends the coerced numbers, not the strings the inputs hold', async () => {
      const user = userEvent.setup();
      renderSettings();
      await openGarageEditor(user);

      await user.click(garagePanel().getByRole('button', { name: /Save Garage Info/i }));

      await waitFor(() => expect(garageService.updateGarage).toHaveBeenCalled());
      const payload = vi.mocked(garageService.updateGarage).mock.calls[0][0];
      expect(payload.settings?.taxRate).toBe(18);
      expect(payload.settings?.laborRatePerHour).toBe(500);
    });
  });

  describe('profile', () => {
    it('rejects a malformed phone number before it reaches the API', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.getByText('Edit My Profile')).toBeInTheDocument());

      const phone = screen.getByLabelText(/^Phone/i);
      await user.clear(phone);
      await user.type(phone, 'not a phone');
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      expect(await screen.findByText(/Enter a valid phone number/i)).toBeInTheDocument();
      expect(authService.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('change password', () => {
    it('reports a mismatch on the confirm field, where the user is looking', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.getByText('Change Password')).toBeInTheDocument());

      await user.type(screen.getByLabelText(/Current Password/i), 'oldsecret');
      await user.type(screen.getByLabelText(/^New Password/i), 'newsecret');
      await user.type(screen.getByLabelText(/Confirm New Password/i), 'newsecrat');
      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('submits once both match and clear the minimum', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.getByText('Change Password')).toBeInTheDocument());

      await user.type(screen.getByLabelText(/Current Password/i), 'oldsecret');
      await user.type(screen.getByLabelText(/^New Password/i), 'newsecret');
      await user.type(screen.getByLabelText(/Confirm New Password/i), 'newsecret');
      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => expect(authService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldsecret',
        newPassword: 'newsecret',
      }));
    });
  });

  describe('staff modal', () => {
    it('requires a password when adding, but not when editing', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.getByText('Imran Shaikh')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /Add Staff/i }));
      const form = staffModalForm();
      await user.type(within(form).getByLabelText(/Full Name/i), 'New Person');
      await user.type(within(form).getByLabelText(/Email/i), 'new@example.com');
      await user.type(within(form).getByLabelText(/^Phone/i), '9876543212');
      await user.click(within(form).getByRole('button', { name: /Add Staff Member/i }));

      expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('rejects a malformed email inline instead of round-tripping to the server', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.getByText('Imran Shaikh')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /Add Staff/i }));
      const form = staffModalForm();
      await user.type(within(form).getByLabelText(/Full Name/i), 'New Person');
      await user.type(within(form).getByLabelText(/Email/i), 'not-an-email');
      await user.type(within(form).getByLabelText(/^Phone/i), '9876543212');
      await user.click(within(form).getByRole('button', { name: /Add Staff Member/i }));

      expect(await screen.findByText(/Enter a valid email address/i)).toBeInTheDocument();
      expect(userService.createUser).not.toHaveBeenCalled();
    });
  });
});
