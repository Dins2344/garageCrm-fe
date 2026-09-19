import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MonthlyBusinessPanel from './MonthlyBusinessPanel';
import * as dashboardService from '../services/apiServices/dashboardService';
import { currentMonthKey, shiftMonth, monthLabel } from '../utils/months';
import type { MonthlyMetrics } from '../types/models';

vi.mock('../services/apiServices/dashboardService');

vi.mock('../context/GarageContext', async () => {
  const { DEFAULT_LOCALE } = await import('../utils/locale');
  return { useGarage: () => ({ locale: DEFAULT_LOCALE, activeGarageId: 'g1', garages: [] }) };
});

const metrics = (over: Partial<MonthlyMetrics> = {}): MonthlyMetrics => ({
  month: currentMonthKey(), revenue: 50000, services: 12, expenses: 32500, netProfit: 17500,
  previous: { month: shiftMonth(currentMonthKey(), -1), revenue: 40000, services: 10, expenses: 30000, netProfit: 10000 },
  expensesByCategory: [
    { category: 'rent', total: 20000, count: 1 },
    { category: 'parts', total: 12500, count: 3 }
  ],
  ...over
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(dashboardService.getMonthlyMetrics).mockResolvedValue({ success: true, data: metrics() });
});

describe('MonthlyBusinessPanel', () => {
  it('shows the four figures with their change against last month, and the category split', async () => {
    render(<MemoryRouter><MonthlyBusinessPanel /></MemoryRouter>);

    expect(await screen.findByText('Total revenue')).toBeInTheDocument();
    expect(dashboardService.getMonthlyMetrics).toHaveBeenCalledWith(currentMonthKey());
    expect(screen.getByText('₹50,000.00')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('₹32,500.00')).toBeInTheDocument();
    expect(screen.getByText('Net profit')).toBeInTheDocument();
    expect(screen.getByText('₹17,500.00')).toBeInTheDocument();

    expect(screen.getByText('+25% vs last month')).toBeInTheDocument();   // revenue 40k -> 50k
    expect(screen.getByText('+20% vs last month')).toBeInTheDocument();   // services 10 -> 12
    expect(screen.getByText('+8% vs last month')).toBeInTheDocument();    // expenses 30k -> 32.5k
    expect(screen.getByText('+75% vs last month')).toBeInTheDocument();   // profit 10k -> 17.5k

    expect(screen.getByText('Where the money went')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
  });

  it('calls a losing month a loss and refetches when the month changes', async () => {
    vi.mocked(dashboardService.getMonthlyMetrics).mockResolvedValue({
      success: true,
      data: metrics({ revenue: 1000, expenses: 4000, netProfit: -3000, previous: { month: 'x', revenue: 0, services: 0, expenses: 0, netProfit: 0 }, expensesByCategory: [] })
    });
    const user = userEvent.setup();
    render(<MemoryRouter><MonthlyBusinessPanel /></MemoryRouter>);

    expect(await screen.findByText('Net loss')).toBeInTheDocument();
    expect(screen.getByText('₹3,000.00')).toBeInTheDocument();
    expect(screen.getAllByText('No figure for last month')).toHaveLength(4);
    expect(screen.queryByText('Where the money went')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await waitFor(() => expect(dashboardService.getMonthlyMetrics).toHaveBeenLastCalledWith(shiftMonth(currentMonthKey(), -1)));
  });

  it('turns several quick taps on the arrow into one request for the month they end on', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><MonthlyBusinessPanel /></MemoryRouter>);
    await screen.findByText('Total revenue');
    expect(dashboardService.getMonthlyMetrics).toHaveBeenCalledTimes(1);

    // Three clicks well inside the 350 ms debounce window.
    const back = screen.getByRole('button', { name: 'Previous month' });
    await user.click(back);
    await user.click(back);
    await user.click(back);
    // The label follows every click; the request waits for the clicks to stop.
    expect(screen.getByRole('group', { name: 'Month' })).toHaveTextContent(monthLabel(shiftMonth(currentMonthKey(), -3), 'en-IN'));
    expect(dashboardService.getMonthlyMetrics).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(dashboardService.getMonthlyMetrics).toHaveBeenCalledTimes(2));
    expect(dashboardService.getMonthlyMetrics).toHaveBeenLastCalledWith(shiftMonth(currentMonthKey(), -3));
    // And nothing more arrives later for the months skipped over.
    await new Promise(r => setTimeout(r, 450));
    expect(dashboardService.getMonthlyMetrics).toHaveBeenCalledTimes(2);
  });
});
