import api from './apiInterceptor';

export const getDashboardStats = async () => {
  const res = await api.get('/dashboard');
  return res.data;
};

export const getChartData = async ({ startDate, endDate, groupBy }) => {
  const res = await api.get('/dashboard/charts', {
    params: { startDate, endDate, groupBy }
  });
  return res.data;
};

export const triggerCron = async () => {
  const res = await api.post('/reminders/trigger-cron');
  return res.data;
};
