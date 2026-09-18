import api from './apiInterceptor';
import type { JobCard, Invoice, ServiceReminder, MonthlyMetrics } from '../../types/models';
import type { ApiItemResponse } from '../../types/api';

export interface StaffAchievement {
  _id: string;
  staffName: string;
  role: string;
  totalLabor: number;
  jobCount: number;
}

export interface DashboardStats {
  overview: {
    totalCustomers: number;
    totalVehicles: number;
    activeJobCards: number;
    todayJobCards: number;
    pendingEstimations: number;
    inProgressJobs: number;
    readyForPickup: number;
  };
  revenue: { today: number; month: number };
  unpaid: { total: number; count: number };
  weeklyRevenue: { date: string; label: string; revenue: number }[];
  jobStatusBreakdown: Record<string, number>;
  lowStockItems: unknown[];
  recentJobCards: JobCard[];
  recentInvoices: Invoice[];
  upcomingReminders: ServiceReminder[];
  staffAchievement: StaffAchievement[];
  queryTimeMs: number;
}

export interface ChartDataPoint {
  key: string;
  label: string;
  revenue: number;
  invoiceCount: number;
}

export interface ChartData {
  revenueTrend: ChartDataPoint[];
  jobStatusBreakdown: Record<string, number>;
}

export interface CronResult {
  processed?: number;
  emailSent?: number;
  smsSent?: number;
  skipped?: number;
  failed?: number;
}

export const getDashboardStats = async (): Promise<ApiItemResponse<DashboardStats>> => {
  const res = await api.get('/dashboard');
  return res.data;
};

export const getChartData = async (
  { startDate, endDate, groupBy }: { startDate: string; endDate: string; groupBy: 'day' | 'week' | 'month' }
): Promise<ApiItemResponse<ChartData>> => {
  const res = await api.get('/dashboard/charts', {
    params: { startDate, endDate, groupBy }
  });
  return res.data;
};

/** One month's revenue, services, expenses and profit (owner/admin). `month` is YYYY-MM. */
export const getMonthlyMetrics = async (month?: string): Promise<ApiItemResponse<MonthlyMetrics>> => {
  const res = await api.get('/dashboard/monthly', { params: month ? { month } : undefined });
  return res.data;
};

export const triggerCron = async (): Promise<{ success: boolean; message: string; data: CronResult }> => {
  const res = await api.post('/reminders/trigger-cron');
  return res.data;
};
