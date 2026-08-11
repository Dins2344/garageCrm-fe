import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

    await user.type(screen.getByPlaceholderText('Full name'), 'Rahul Sharma');
    await user.type(screen.getByPlaceholderText('9876543210'), '9876543210');

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
