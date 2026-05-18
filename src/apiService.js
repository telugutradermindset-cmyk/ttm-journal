import axios from 'axios';

// Use your Railway backend URL
const API_URL = 'https://web-production-2c4af.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (email, password, name) =>
    api.post('/auth/signup', { email, password, name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getMe: () =>
    api.get('/auth/me'),
};

export const tradesAPI = {
  getAllTrades: () =>
    api.get('/trades'),
  createTrade: (trade) =>
    api.post('/trades', trade),
  updateTrade: (id, trade) =>
    api.put(`/trades/${id}`, trade),
  deleteTrade: (id) =>
    api.delete(`/trades/${id}`),
  bulkImportTrades: (trades) =>
    api.post('/trades/bulk-import', { trades }),
  getTradeStats: () =>
    api.get('/trades/stats'),
};

export const userAPI = {
  updateProfile: (data) =>
    api.put('/user/profile', data),
  updatePassword: (oldPassword, newPassword) =>
    api.post('/user/update-password', { oldPassword, newPassword }),
};

export default api;
