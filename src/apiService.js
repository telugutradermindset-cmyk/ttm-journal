import axios from 'axios';

// Set your Railway backend URL here
const API_BASE_URL = 'https://web-production-2c4af.up.railway.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
);

const apiService = {
  // Auth endpoints
  signup: (name, email, password) =>
    api.post('/api/auth/signup', { name, email, password }),
  
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  
  getMe: () =>
    api.get('/api/auth/me'),

  // Trade endpoints
  getTrades: () =>
    api.get('/api/trades'),
  
  addTrade: (tradeData) =>
    api.post('/api/trades', tradeData),
  
  updateTrade: (id, tradeData) =>
    api.put(`/api/trades/${id}`, tradeData),
  
  deleteTrade: (id) =>
    api.delete(`/api/trades/${id}`),
  
  getStats: () =>
    api.get('/api/trades/stats'),

  // User endpoints
  updateProfile: (userData) =>
    api.put('/api/user/profile', userData),
  
  updatePassword: (oldPassword, newPassword) =>
    api.post('/api/user/change-password', { oldPassword, newPassword }),
};

export default apiService;
