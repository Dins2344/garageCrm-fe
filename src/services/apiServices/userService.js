import api from './apiInterceptor';

export const getUsers = (params) => api.get('/users', { params }).then(r => r.data);
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data);
export const createUser = (data) => api.post('/users', data).then(r => r.data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then(r => r.data);
export const deleteUser = (id) => api.delete(`/users/${id}`).then(r => r.data);
export const getMechanics = () => api.get('/users').then(r => r.data.data.filter(u => u.role === 'mechanic'));
export const getAdvisors = () => api.get('/users').then(r => r.data.data.filter(u => u.role === 'service_advisor'));
