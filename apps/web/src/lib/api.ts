import axios from 'axios';

// Ensure we point to /api endpoint
const envUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = envUrl
  ? (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`)
  : (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Only redirect if NOT on login page and receives 401
    // This allows Login component to handle 401 "Invalid credentials" without reload
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;






