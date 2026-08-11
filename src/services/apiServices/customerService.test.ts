import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from './customerService';
import api from './apiInterceptor';

vi.mock('./apiInterceptor', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

/**
 * These tests lock in the service-layer contract every page relies on:
 * each function calls the shared axios instance with the right verb/URL
 * and unwraps `res.data` (the API response envelope) before returning.
 */
describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCustomers calls GET /customers with params and unwraps the envelope', async () => {
    const envelope = { success: true, count: 1, total: 1, pages: 1, currentPage: 1, data: [{ _id: 'c1', name: 'Rahul', phone: '9000000001' }] };
    vi.mocked(api.get).mockResolvedValue({ data: envelope });

    const result = await getCustomers({ search: 'rahul', page: 1, limit: 10 });

    expect(api.get).toHaveBeenCalledWith('/customers', { params: { search: 'rahul', page: 1, limit: 10 } });
    expect(result).toEqual(envelope);
  });

  it('getCustomer calls GET /customers/:id', async () => {
    const envelope = { success: true, data: { _id: 'c1', name: 'Rahul', phone: '9000000001' } };
    vi.mocked(api.get).mockResolvedValue({ data: envelope });

    const result = await getCustomer('c1');

    expect(api.get).toHaveBeenCalledWith('/customers/c1');
    expect(result).toEqual(envelope);
  });

  it('createCustomer calls POST /customers with the form payload', async () => {
    const envelope = { success: true, data: { _id: 'c2', name: 'New Customer', phone: '9000000002' } };
    vi.mocked(api.post).mockResolvedValue({ data: envelope });

    const payload = { name: 'New Customer', phone: '9000000002' };
    const result = await createCustomer(payload);

    expect(api.post).toHaveBeenCalledWith('/customers', payload);
    expect(result).toEqual(envelope);
  });

  it('updateCustomer calls PUT /customers/:id', async () => {
    const envelope = { success: true, data: { _id: 'c1', name: 'Updated', phone: '9000000001' } };
    vi.mocked(api.put).mockResolvedValue({ data: envelope });

    const result = await updateCustomer('c1', { name: 'Updated' });

    expect(api.put).toHaveBeenCalledWith('/customers/c1', { name: 'Updated' });
    expect(result).toEqual(envelope);
  });

  it('deleteCustomer calls DELETE /customers/:id', async () => {
    const envelope = { success: true, message: 'Customer deleted successfully' };
    vi.mocked(api.delete).mockResolvedValue({ data: envelope });

    const result = await deleteCustomer('c1');

    expect(api.delete).toHaveBeenCalledWith('/customers/c1');
    expect(result).toEqual(envelope);
  });
});
