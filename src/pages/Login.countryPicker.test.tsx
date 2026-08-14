import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import * as metaService from '../services/apiServices/metaService';
import { __setCountryCache } from '../hooks/useCountries';
import type { CountryOption } from '../types/models';

vi.mock('../services/apiServices/metaService');

const registerMock = vi.fn().mockResolvedValue({ _id: 'u1' });
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), register: registerMock })
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() }
}));

const COUNTRIES: CountryOption[] = [
  {
    code: 'IN', name: 'India', currency: 'INR', taxLabel: 'GST', taxIdLabel: 'GSTIN',
    postalLabel: 'Pincode', postalInputMode: 'numeric', phoneExample: '98765 43210',
    requiresTimezoneChoice: false,
  },
  {
    code: 'GB', name: 'United Kingdom', currency: 'GBP', taxLabel: 'VAT', taxIdLabel: 'VAT No.',
    postalLabel: 'Postcode', postalInputMode: 'text', phoneExample: '07911 123456',
    requiresTimezoneChoice: false,
  },
  {
    code: 'US', name: 'United States', currency: 'USD', taxLabel: 'Sales Tax', taxIdLabel: 'EIN',
    postalLabel: 'ZIP Code', postalInputMode: 'numeric', phoneExample: '(212) 555-1234',
    requiresTimezoneChoice: true,
  },
];

/** Renders the page already switched into registration mode. */
const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={['/login?register=true']}>
      <Login />
    </MemoryRouter>
  );

describe('registration country picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The hook caches at module scope so two pickers share one request.
    __setCountryCache(null);
    vi.mocked(metaService.listCountries).mockResolvedValue({ success: true, data: COUNTRIES });
  });

  it('defaults to India, matching what the server assumes', async () => {
    renderRegister();
    const select = await screen.findByLabelText<HTMLSelectElement>('Country');
    expect(select.value).toBe('IN');
  });

  it('offers every supported country once the list loads', async () => {
    renderRegister();
    await waitFor(() => expect(screen.getByRole('option', { name: 'United Kingdom' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'United States' })).toBeInTheDocument();
  });

  it('shows the selected country\'s phone example, not India\'s', async () => {
    const user = userEvent.setup();
    renderRegister();
    await waitFor(() => expect(screen.getByRole('option', { name: 'United Kingdom' })).toBeInTheDocument());

    expect(screen.getByPlaceholderText('98765 43210')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Country'), 'GB');
    expect(screen.getByPlaceholderText('07911 123456')).toBeInTheDocument();
  });

  it('asks for a timezone only for countries that span several', async () => {
    const user = userEvent.setup();
    renderRegister();
    await waitFor(() => expect(screen.getByRole('option', { name: 'United States' })).toBeInTheDocument());

    expect(screen.queryByLabelText('Timezone')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Country'), 'US');
    expect(await screen.findByLabelText('Timezone')).toBeInTheDocument();

    // ...and it disappears again — with its value cleared, so a US zone can't
    // ride along on a garage that just switched to the UK.
    await user.selectOptions(screen.getByLabelText('Country'), 'GB');
    expect(screen.queryByLabelText('Timezone')).not.toBeInTheDocument();
  });

  it('sends the chosen country and timezone to the API', async () => {
    const user = userEvent.setup();
    renderRegister();
    await waitFor(() => expect(screen.getByRole('option', { name: 'United States' })).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('Country'), 'US');
    await user.selectOptions(screen.getByLabelText('Timezone'), 'America/Chicago');
    await user.type(screen.getByLabelText('Your Name'), 'Sam Owner');
    await user.type(screen.getByLabelText('Garage Name'), 'Chicago Motors');
    await user.type(screen.getByPlaceholderText('(212) 555-1234'), '2125551234');
    await user.type(screen.getByLabelText('Email Address'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create|sign up|register/i }));

    await waitFor(() => expect(registerMock).toHaveBeenCalled());
    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'US', timezone: 'America/Chicago' })
    );
  });

  it('still lets someone sign up when the country list fails to load', async () => {
    // Reference data is not worth blocking registration over — the form falls
    // back to the default country, which is what every garage got before the
    // picker existed.
    vi.mocked(metaService.listCountries).mockRejectedValue(new Error('offline'));
    renderRegister();
    const select = await screen.findByLabelText<HTMLSelectElement>('Country');
    expect(select.value).toBe('IN');
    expect(screen.getByPlaceholderText('98765 43210')).toBeInTheDocument();
  });
});
