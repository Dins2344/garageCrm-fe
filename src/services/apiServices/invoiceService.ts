import type { AxiosResponse } from 'axios';
import api from './apiInterceptor';
import type { Invoice, PaymentStatus, PaymentMethod } from '../../types/models';
import type { ApiListResponse, ApiItemResponse, ApiMessageResponse } from '../../types/api';

export interface InvoiceListParams {
  search?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export interface UpdatePaymentData {
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
}

export const getInvoices = (params?: InvoiceListParams): Promise<ApiListResponse<Invoice>> =>
  api.get('/invoices', { params }).then(r => r.data);

export const getInvoice = (id: string): Promise<ApiItemResponse<Invoice>> =>
  api.get(`/invoices/${id}`).then(r => r.data);

export const createInvoice = (data: { jobCardId: string }): Promise<ApiItemResponse<Invoice>> =>
  api.post('/invoices', data).then(r => r.data);

export const deleteInvoice = (id: string): Promise<ApiMessageResponse> =>
  api.delete(`/invoices/${id}`).then(r => r.data);

export const updateInvoicePayment = (id: string, data: UpdatePaymentData): Promise<ApiItemResponse<Invoice>> =>
  api.put(`/invoices/${id}/payment`, data).then(r => r.data);

export const downloadInvoicePdf = (id: string): Promise<AxiosResponse<Blob>> =>
  api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
