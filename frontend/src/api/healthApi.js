import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
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

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        const { token } = response.data;
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (err) {
        // Refresh token expired, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const logout = () => api.post('/auth/logout');
export const refreshToken = () => api.post('/auth/refresh');

// User APIs
export const fetchUserProfile = () => api.get('/users/profile');
export const updateUserProfile = (data) => api.put('/users/profile', data);
export const changePassword = (data) => api.post('/users/change-password', data);

// Patient APIs
export const fetchPatientData = (patientId) => api.get(`/patients/${patientId}`);
export const updatePatientData = (patientId, data) => api.put(`/patients/${patientId}`, data);
export const fetchPatientList = (params) => api.get('/patients', { params });

// Professional APIs
export const fetchProfessionalProfile = (professionalId) => api.get(`/professionals/${professionalId}`);
export const updateProfessionalProfile = (professionalId, data) => api.put(`/professionals/${professionalId}`, data);
export const fetchProfessionalList = (params) => api.get('/professionals', { params });

// Appointment APIs
export const fetchAppointments = (params) => api.get('/appointments', { params });
export const createAppointment = (data) => api.post('/appointments', data);
export const updateAppointment = (appointmentId, data) => api.put(`/appointments/${appointmentId}`, data);
export const cancelAppointment = (appointmentId) => api.delete(`/appointments/${appointmentId}`);
export const rescheduleAppointment = (appointmentId, data) => api.post(`/appointments/${appointmentId}/reschedule`, data);

// Medical Record APIs
export const fetchMedicalRecords = (params) => api.get('/medical-records', { params });
export const createMedicalRecord = (data) => api.post('/medical-records', data);
export const updateMedicalRecord = (recordId, data) => api.put(`/medical-records/${recordId}`, data);
export const fetchMedicalRecord = (recordId) => api.get(`/medical-records/${recordId}`);
export const attachDocument = (recordId, data) => api.post(`/medical-records/${recordId}/documents`, data);

// Prescription APIs
export const fetchPrescriptions = (params) => api.get('/prescriptions', { params });
export const createPrescription = (data) => api.post('/prescriptions', data);
export const updatePrescription = (prescriptionId, data) => api.put(`/prescriptions/${prescriptionId}`, data);
export const refillPrescription = (prescriptionId) => api.post(`/prescriptions/${prescriptionId}/refill`);

// Vital Signs APIs
export const fetchVitalSigns = (params) => api.get('/vital-signs', { params });
export const recordVitalSign = (data) => api.post('/vital-signs', data);
export const fetchVitalSignTypes = () => api.get('/vital-signs/types');
export const fetchVitalSignStats = (patientId, params) => api.get(`/vital-signs/stats/${patientId}`, { params });

// ML Service APIs
export const performRiskAssessment = (patientId) => api.post('/ml-service/risk-assessment', { patient_id: patientId });
export const generateHealthPredictions = (patientId, type) => api.post('/ml-service/health-prediction', { patient_id: patientId, prediction_type: type });
export const detectAnomalies = (patientId) => api.post('/ml-service/anomaly-detection', { patient_id: patientId });

// Error Handler
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    return {
      status,
      message: data.message || 'An error occurred',
      errors: data.errors,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 503,
      message: 'Service unavailable',
    };
  } else {
    // Error setting up request
    return {
      status: 500,
      message: error.message,
    };
  }
};
