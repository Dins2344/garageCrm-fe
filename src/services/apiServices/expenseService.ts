import api from './apiInterceptor';
import type { Expense, ExpenseCategory, PaymentMethod } from '../../types/models';
import type { ApiListResponse, ApiItemResponse, ApiMessageResponse } from '../../types/api';

export interface ExpenseListParams {
  /** YYYY-MM */
  month?: string;
  category?: ExpenseCategory | '';
  search?: string;
  page?: number;
  limit?: number;
}

/** The list carries the filtered total too, so the page never sums a partial page. */
export type ExpenseListResponse = ApiListResponse<Expense> & { totalAmount: number };

export interface ExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  /** YYYY-MM-DD or ISO */
  expenseDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export const getExpenses = (params?: ExpenseListParams): Promise<ExpenseListResponse> =>
  api.get('/expenses', { params }).then(r => r.data);

export const createExpense = (data: ExpenseInput): Promise<ApiItemResponse<Expense>> =>
  api.post('/expenses', data).then(r => r.data);

export const updateExpense = (id: string, data: Partial<ExpenseInput>): Promise<ApiItemResponse<Expense>> =>
  api.put(`/expenses/${id}`, data).then(r => r.data);

export const deleteExpense = (id: string): Promise<ApiMessageResponse> =>
  api.delete(`/expenses/${id}`).then(r => r.data);
