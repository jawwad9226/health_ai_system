import axios from 'axios';
import { handleApiError, isNetworkError } from '../utils/errorHandling';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check for network errors first
    if (isNetworkError(error)) {
      // Try to get cached data if available
      const cachedData = await caches.match(error.config.url);
      if (cachedData) {
        return cachedData.json();
      }
    }

    return handleApiError(error);
  }
);

export default api;
