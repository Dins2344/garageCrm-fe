import api from './apiInterceptor';

export const getInvoices = (params) => api.get('/invoices', { params }).then(r => r.data);
export const getInvoice = (id) => api.get(`/invoices/${id}`).then(r => r.data);
export const createInvoice = (data) => api.post('/invoices', data).then(r => r.data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`).then(r => r.data);
export const updateInvoicePayment = (id, data) => api.put(`/invoices/${id}/payment`, data).then(r => r.data);
export const downloadInvoicePdf = (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
