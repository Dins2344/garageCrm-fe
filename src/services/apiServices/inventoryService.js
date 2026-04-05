import api from './apiInterceptor';

export const getInventoryItems = (params) => api.get('/inventory', { params }).then(r => r.data);
export const getInventoryItem = (id) => api.get(`/inventory/${id}`).then(r => r.data);
export const createInventoryItem = (data) => api.post('/inventory', data).then(r => r.data);
export const updateInventoryItem = (id, data) => api.put(`/inventory/${id}`, data).then(r => r.data);
export const deleteInventoryItem = (id) => api.delete(`/inventory/${id}`).then(r => r.data);
