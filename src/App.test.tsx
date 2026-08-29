import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as authService from './services/apiServices/authService';
import * as dashboardService from './services/apiServices/dashboardService';
import type { User } from './types/models';

vi.mock('./services/apiServices/authService');
vi.mock('./services/apiServices/dashboardService');

const mechanicUser: User = {
  _id: 'u1',
  name: 'Mo the Mechanic',
  email: 'mechanic@example.com',
  phone: '9000000003',
  role: 'mechanic',
  garage: 'g1',
  isActive: true
};

/**
 * These are black-box integration tests of the routing guards defined in
 * App.tsx (ProtectedRoute / AuthRoute aren't exported — they're only
 * reachable by rendering the real app and asserting on what lands on screen).
 */
describe('App routing guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects an unauthenticated visitor from a protected route to /home', async () => {
    vi.mocked(authService.getMe).mockRejectedValue(new Error('401'));
    window.history.pushState({}, '', '/');

    render(<App />);

    // The landing page's h1 is the marker that we bounced to /home. Matched on a
    // fragment rather than the full string because the headline is broken across
    // <br /> elements, so the accessible name concatenates the lines.
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /Run every branch/i })).toBeInTheDocument(), { timeout: 3000 });
  });

  it('redirects a role-gated route away when the user lacks the required role', async () => {
    vi.mocked(authService.getMe).mockResolvedValue({ success: true, data: mechanicUser });
    vi.mocked(dashboardService.getDashboardStats).mockResolvedValue({
      success: true,
      data: {
        overview: { totalCustomers: 0, totalVehicles: 0, activeJobCards: 0, todayJobCards: 0, pendingEstimations: 0, inProgressJobs: 0, readyForPickup: 0 },
        revenue: { today: 0, month: 0 },
        unpaid: { total: 0, count: 0 },
        weeklyRevenue: [],
        jobStatusBreakdown: {},
        lowStockItems: [],
        recentJobCards: [],
        recentInvoices: [],
        upcomingReminders: [],
        staffAchievement: [],
        queryTimeMs: 0
      }
    });
    vi.mocked(dashboardService.getChartData).mockResolvedValue({
      success: true,
      data: { revenueTrend: [], jobStatusBreakdown: {} }
    });

    // /invoices requires owner/admin/service_advisor — a mechanic should bounce to "/" (Dashboard)
    window.history.pushState({}, '', '/invoices');

    render(<App />);

    // No local `timeout` override: a per-call value replaces the global
    // `asyncUtilTimeout` from src/test/setup.ts outright, and a hardcoded 3s
    // here is not enough for Dashboard's lazy chunk (which pulls in Recharts)
    // under a loaded parallel run. That is what made this test flaky.
    await waitFor(() => expect(screen.getByText(/Dashboard Overview/i)).toBeInTheDocument());
  });
});
