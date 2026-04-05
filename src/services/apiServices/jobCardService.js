import api from './apiInterceptor';

export const getJobCards = (params) => api.get('/jobcards', { params }).then(r => r.data);
export const getJobCard = (id) => api.get(`/jobcards/${id}`).then(r => r.data);
export const createJobCard = (data) => api.post('/jobcards', data).then(r => r.data);
export const updateJobCard = (id, data) => api.put(`/jobcards/${id}`, data).then(r => r.data);
export const deleteJobCard = (id) => api.delete(`/jobcards/${id}`).then(r => r.data);
export const saveJobCardEstimation = (id, data) => api.put(`/jobcards/${id}/estimation`, data).then(r => r.data);
export const approveJobCardEstimation = (id) => api.put(`/jobcards/${id}/approve`).then(r => r.data);
export const downloadEstimationPDF = (id) => api.get(`/jobcards/${id}/estimation/download`, { responseType: 'blob' });
