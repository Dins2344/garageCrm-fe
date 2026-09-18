import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Expenses from './Expenses';
import * as expenseService from '../services/apiServices/expenseService';
import { currentMonthKey, shiftMonth } from '../utils/months';
import type { Expense } from '../types/models';

vi.mock('../services/apiServices/expenseService');

vi.mock('../context/GlobalLoaderContext', () => ({
  useGlobalLoader: () => ({ withLoader: async (fn: () => Promise<unknown>) => fn() })
}));

vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return { useGarage: () => ({ locale: DEFAULT_LOCALE, activeGarageId: 'g1', garages: [] }) };
});

const expense = (over: Partial<Expense> = {}): Expense => ({
  _id: 'e1', title: 'Engine oil stock', category: 'parts', amount: 12500, expenseDate: '2026-09-03T06:30:00.000Z',
  paymentMethod: 'upi', notes: '', garage: 'g1', ...over
});

const listResponse = (data: Expense[], totalAmount = data.reduce((s, e) => s + e.amount, 0)) => ({
  success: true, count: data.length, total: data.length, totalAmount, pages: 1, currentPage: 1, data
});

const lastListCall = () => vi.mocked(expenseService.getExpenses).mock.calls.at(-1)![0]!;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(expenseService.getExpenses).mockResolvedValue(listResponse([expense(), expense({ _id: 'e2', title: 'Rent', category: 'rent', amount: 20000, paymentMethod: 'bank_transfer' })]));
  vi.mocked(expenseService.createExpense).mockResolvedValue({ success: true, data: expense({ _id: 'e3' }) });
  vi.mocked(expenseService.updateExpense).mockResolvedValue({ success: true, data: expense() });
  vi.mocked(expenseService.deleteExpense).mockResolvedValue({ success: true, message: 'Expense deleted' });
});

describe('Expenses', () => {
  it("loads the current month and shows the API's total, not a sum of the page", async () => {
    render(<MemoryRouter><Expenses /></MemoryRouter>);

    await screen.findByText('Engine oil stock');
    expect(lastListCall()).toMatchObject({ month: currentMonthKey(), page: 1 });
    // The title and its category badge both read "Rent".
    expect(screen.getAllByText('Rent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('month-total')).toHaveTextContent('32,500.00');
    expect(screen.getByText('2 entries')).toBeInTheDocument();
  });

  it('steps back a month and filters by category from page 1', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Expenses /></MemoryRouter>);
    await screen.findByText('Engine oil stock');

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await waitFor(() => expect(lastListCall().month).toBe(shiftMonth(currentMonthKey(), -1)));
    // The current month is the ceiling: forward is offered only up to it.
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await waitFor(() => expect(lastListCall().month).toBe(currentMonthKey()));
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'rent');
    await waitFor(() => expect(lastListCall()).toMatchObject({ category: 'rent', page: 1 }));
  });

  it('records a new expense from the form with the numbers coerced', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Expenses /></MemoryRouter>);
    await screen.findByText('Engine oil stock');

    await user.click(screen.getByRole('button', { name: /Add Expense/ }));
    const dialog = screen.getByRole('dialog');
    // Submitting empty is blocked by the schema, not the API.
    await user.click(within(dialog).getByRole('button', { name: 'Record Expense' }));
    expect(await within(dialog).findByText('Title is required')).toBeInTheDocument();
    expect(expenseService.createExpense).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText(/Title/), 'Brake pads');
    await user.type(within(dialog).getByLabelText(/Amount/), '3200.50');
    await user.selectOptions(within(dialog).getByLabelText(/Category/), 'parts');
    await user.selectOptions(within(dialog).getByLabelText(/Paid via/), 'cash');
    await user.click(within(dialog).getByRole('button', { name: 'Record Expense' }));

    await waitFor(() => expect(expenseService.createExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Brake pads', amount: 3200.5, category: 'parts', paymentMethod: 'cash', expenseDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    })));
    // The list is refetched after a save.
    expect(vi.mocked(expenseService.getExpenses).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('edits an existing expense with its values pre-filled', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Expenses /></MemoryRouter>);
    await screen.findByText('Engine oil stock');

    await user.click(screen.getByRole('button', { name: 'Edit Engine oil stock' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText(/Title/)).toHaveValue('Engine oil stock');
    expect(within(dialog).getByLabelText(/Amount/)).toHaveValue(12500);
    expect(within(dialog).getByLabelText(/Date/)).toHaveValue('2026-09-03');

    await user.clear(within(dialog).getByLabelText(/Amount/));
    await user.type(within(dialog).getByLabelText(/Amount/), '13000');
    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(expenseService.updateExpense).toHaveBeenCalledWith('e1', expect.objectContaining({ amount: 13000 })));
  });

  it('deletes after confirmation only', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Expenses /></MemoryRouter>);
    await screen.findByRole('button', { name: 'Delete Rent' });

    await user.click(screen.getByRole('button', { name: 'Delete Rent' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(expenseService.deleteExpense).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete Rent' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(expenseService.deleteExpense).toHaveBeenCalledWith('e2'));
  });
});
