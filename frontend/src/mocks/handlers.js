import { rest } from 'msw';
import {
  mockUser,
  mockAppointments,
  mockMedicalRecords,
  mockVitalSigns,
  mockRiskAssessment,
  mockHealthMetrics,
  mockAlerts,
  mockApiResponses,
} from '../__tests__/utils/mockData';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const handlers = [
  // Auth endpoints
  rest.post(`${API_BASE_URL}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body;
    
    if (email === 'test@example.com' && password === 'password') {
      return res(ctx.status(200), ctx.json(mockApiResponses.login));
    }
    
    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid credentials' })
    );
  }),

  rest.post(`${API_BASE_URL}/auth/register`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockApiResponses.register));
  }),

  rest.post(`${API_BASE_URL}/auth/logout`, (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.post(`${API_BASE_URL}/auth/refresh`, (req, res, ctx) => {
    const refreshToken = req.body.refresh_token;
    if (refreshToken) {
      return res(
        ctx.status(200),
        ctx.json({ token: 'new-mock-jwt-token' })
      );
    }
    return res(ctx.status(401));
  }),

  // User endpoints
  rest.get(`${API_BASE_URL}/users/profile`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return res(ctx.status(401));
    }
    return res(ctx.status(200), ctx.json(mockUser));
  }),

  rest.put(`${API_BASE_URL}/users/profile`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ ...mockUser, ...req.body }));
  }),

  // Appointments endpoints
  rest.get(`${API_BASE_URL}/appointments`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockAppointments));
  }),

  rest.post(`${API_BASE_URL}/appointments`, (req, res, ctx) => {
    const newAppointment = {
      id: Date.now().toString(),
      ...req.body,
    };
    return res(ctx.status(201), ctx.json(newAppointment));
  }),

  rest.put(`${API_BASE_URL}/appointments/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ ...mockAppointments[0], ...req.body })
    );
  }),

  // Medical Records endpoints
  rest.get(`${API_BASE_URL}/medical-records`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockMedicalRecords));
  }),

  rest.post(`${API_BASE_URL}/medical-records`, (req, res, ctx) => {
    const newRecord = {
      id: Date.now().toString(),
      ...req.body,
    };
    return res(ctx.status(201), ctx.json(newRecord));
  }),

  // Vital Signs endpoints
  rest.get(`${API_BASE_URL}/vital-signs`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockVitalSigns));
  }),

  rest.post(`${API_BASE_URL}/vital-signs`, (req, res, ctx) => {
    const newVitalSign = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...req.body,
    };
    return res(ctx.status(201), ctx.json(newVitalSign));
  }),

  // ML Service endpoints
  rest.post(`${API_BASE_URL}/ml-service/risk-assessment`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockRiskAssessment));
  }),

  rest.post(`${API_BASE_URL}/ml-service/health-prediction`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockHealthMetrics));
  }),

  // Error scenarios
  rest.get(`${API_BASE_URL}/error-test/500`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ message: 'Internal Server Error' })
    );
  }),

  rest.get(`${API_BASE_URL}/error-test/404`, (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({ message: 'Resource not found' })
    );
  }),

  rest.get(`${API_BASE_URL}/error-test/network`, (req, res, ctx) => {
    return res.networkError('Failed to connect');
  }),
];
