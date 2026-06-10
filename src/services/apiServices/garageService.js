import api from './apiInterceptor';

export const getGarage = () => api.get('/garage').then(r => r.data);

export const updateGarage = (data) => api.put('/garage', data).then(r => r.data);
