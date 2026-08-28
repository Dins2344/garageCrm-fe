import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Customers from './Customers';
import * as customerService from '../services/apiServices/customerService';
import type { Customer } from '../types/models';

vi.mock('../services/apiServices/customerService');

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ hasRole: () => true, user: { _id: 'u1', role: 'owner' }, loading: false })
}));

vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({ withLoader: async (fn: () => Promise<unknown>) => fn() })
}));

// The page formats money and phone placeholders from the garage's locale.
// `locale` is never undefined in the real provider (it falls back to
// DEFAULT_LOCALE), so the mock has to honour that.
vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return {
    useGarage: () => ({
      garages: [], activeGarageId: 'g1', activeGarageName: 'Test Garage',
      activeGarage: null, locale: DEFAULT_LOCALE,
      refreshGarage: vi.fn(), switchGarage: vi.fn(),
      addBranch: vi.fn(), removeBranch: vi.fn(),
    })
  };
});

const sampleCustomer: Customer = {
  _id: 'c1',
  name: 'Rahul Sharma',
  phone: '9876543210',
  email: 'rahul@example.com',
  totalVisits: 3,
  totalSpent: 4500,
  vehicles: []
};

describe('Customers page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and renders the customer list', async () => {
    vi.mocked(customerService.getCustomers).mockResolvedValue({
      success: true, count: 1, total: 1, pages: 1, currentPage: 1, data: [sampleCustomer]
    });

    render(<Customers />);

    await waitFor(() => expect(screen.getByText('Rahul Sharma')).toBeInTheDocument());
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    expect(customerService.getCustomers).toHaveBeenCalled();
  });

  it('shows an empty state when there are no customers', async () => {
    vi.mocked(customerService.getCustomers).mockResolvedValue({
      success: true, count: 0, total: 0, pages: 1, currentPage: 1, data: []
    });

    render(<Customers />);

    await waitFor(() => expect(screen.getByText('No customers found')).toBeInTheDocument());
  });

  it('creates a new customer via the Add Customer modal', async () => {
    vi.mocked(customerService.getCustomers)
      .mockResolvedValueOnce({ success: true, count: 0, total: 0, pages: 1, currentPage: 1, data: [] })
      .mockResolvedValueOnce({ success: true, count: 1, total: 1, pages: 1, currentPage: 1, data: [sampleCustomer] });
    vi.mocked(customerService.createCustomer).mockResolvedValue({ success: true, data: sampleCustomer });

    const user = userEvent.setup();
    render(<Customers />);

    await waitFor(() => expect(screen.getByText('No customers found')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add customer/i }));

    // Selected by label, not placeholder: the phone placeholder is now the
    // garage country's example number, so using it as a selector would tie
    // this test to user-facing copy that legitimately varies per tenant.
    await user.type(screen.getByLabelText(/customer name/i), 'Rahul Sharma');
    await user.type(screen.getByLabelText(/phone number/i), '9876543210');

    // Two "Add Customer" buttons exist once the modal is open (the page
    // header button that opened it, and the modal's own submit button) —
    // the submit button is the one rendered last (portal, appended to body).
    const addButtons = screen.getAllByRole('button', { name: /^add customer$/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => expect(customerService.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Rahul Sharma', phone: '9876543210' })
    ));
    // List should be refetched after a successful create
    await waitFor(() => expect(customerService.getCustomers).toHaveBeenCalledTimes(2));
  });
});

/**
 * The schemas are unit-tested in utils/validation.test.ts. These cover the
 * wiring: that the resolver is actually attached, that a failure blocks the
 * API call, and that the message reaches the screen.
 */
describe('Customers form validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customerService.getCustomers).mockResolvedValue({
      success: true, count: 0, total: 0, pages: 1, currentPage: 1, data: []
    });
  });

  // "Add Customer" names both the page trigger and the modal's submit button.
  // Filtering on `.type === 'submit'` does NOT disambiguate them: a <button>
  // with no type attribute still reports "submit", so that matched the page
  // trigger and silently re-opened the modal instead of submitting. Scope to
  // the form instead — and note the modal is portalled to document.body, so it
  // is not inside render()'s container.
  const submitButton = () =>
    within(document.querySelector('form') as HTMLFormElement)
      .getByRole('button', { name: /add customer/i });

  const openAddModal = async () => {
    const user = userEvent.setup();
    render(<Customers />);
    const trigger = await screen.findByRole('button', { name: /add customer/i });
    await user.click(trigger);
    await waitFor(() => expect(submitButton()).toBeTruthy());
    return user;
  };

  it('blocks submission and does not call the API when required fields are empty', async () => {
    const user = await openAddModal();

    await user.click(submitButton());

    await waitFor(() => expect(screen.getByText(/customer name is required/i)).toBeInTheDocument());
    // The important half: nothing was sent.
    expect(customerService.createCustomer).not.toHaveBeenCalled();
  });

  it('rejects a malformed phone number with an inline message', async () => {
    const user = await openAddModal();

    await user.type(screen.getByLabelText(/customer name/i), 'Anita Desai');
    await user.type(screen.getByLabelText(/phone number/i), '123');
    await user.click(submitButton());

    await waitFor(() => expect(screen.getByText(/valid phone number/i)).toBeInTheDocument());
    expect(customerService.createCustomer).not.toHaveBeenCalled();
  });

  it('submits trimmed, validated values once the form is correct', async () => {
    vi.mocked(customerService.createCustomer).mockResolvedValue({
      success: true, data: sampleCustomer
    });
    const user = await openAddModal();

    await user.type(screen.getByLabelText(/customer name/i), '  Anita Desai  ');
    await user.type(screen.getByLabelText(/phone number/i), '9876500001');
    await user.click(submitButton());

    await waitFor(() => expect(customerService.createCustomer).toHaveBeenCalled());
    // zod's .trim() runs before the handler, so the API never sees the padding.
    expect(vi.mocked(customerService.createCustomer).mock.calls[0][0]).toMatchObject({
      name: 'Anita Desai',
      phone: '9876500001',
    });
  });
});
