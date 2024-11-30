import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor to include auth token
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

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Health Records API
export const healthAPI = {
  createRecord: (data: any) => api.post('/health-records', data),
  getLatestRecord: () => api.get('/health-records/latest'),
  getHistory: (page = 1, perPage = 10) => 
    api.get(`/health-records/history?page=${page}&per_page=${perPage}`),
};

// Risk Predictions API
export const predictionsAPI = {
  getLatest: () => api.get('/predictions/latest'),
  getHistory: (days = 30) => api.get(`/predictions/history?days=${days}`),
};

// Recommendations API
export const recommendationsAPI = {
  getRecommendations: () => api.get('/recommendations'),
  getHistory: (page = 1, perPage = 10) => 
    api.get(`/recommendations/history?page=${page}&per_page=${perPage}`),
  updateStatus: (id: number, status: string) => 
    api.put(`/recommendations/${id}/status`, { status }),
};

export default api;
