// Mock user data
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'patient',
};

// Mock health metrics data
export const mockHealthMetrics = {
  heartRate: 75,
  bloodPressure: {
    systolic: 120,
    diastolic: 80
  },
  temperature: 98.6,
  oxygenLevel: 98,
  glucoseLevel: 95,
};

// Mock appointments data
export const mockAppointments = [
  {
    id: '1',
    date: '2024-01-20T10:00:00',
    doctor: 'Dr. Smith',
    type: 'Check-up',
    status: 'scheduled',
  },
  {
    id: '2',
    date: '2024-01-25T14:30:00',
    doctor: 'Dr. Johnson',
    type: 'Follow-up',
    status: 'completed',
  },
];

// Mock risk assessment data
export const mockRiskAssessment = {
  risk_level: 'medium',
  risk_factors: [
    {
      name: 'Heart Disease',
      description: 'Risk of cardiovascular issues',
      severity: 'low',
      trend: 'down'
    },
    {
      name: 'Diabetes',
      description: 'Blood sugar management',
      severity: 'medium',
      trend: 'up'
    }
  ],
  recommendations: [
    {
      title: 'Regular Exercise',
      description: 'Maintain regular exercise routine'
    },
    {
      title: 'Healthy Diet',
      description: 'Continue balanced nutrition plan'
    }
  ],
  confidence_score: 85
};

// Mock notifications
export const mockNotifications = [
  {
    id: '1',
    type: 'appointment',
    message: 'Upcoming appointment with Dr. Smith',
    date: '2024-01-20T10:00:00',
    read: false,
  },
  {
    id: '2',
    type: 'alert',
    message: 'Blood pressure reading above normal',
    date: '2024-01-18T15:30:00',
    read: true,
  },
];

// Mock error responses
export const mockErrors = {
  network: new Error('Network error'),
  auth: new Error('Authentication failed'),
  notFound: new Error('Resource not found'),
  server: new Error('Internal server error'),
};

// Mock API responses
export const mockApiResponses = {
  login: {
    token: 'mock-jwt-token',
    refresh_token: 'mock-refresh-token',
    user: mockUser,
  },
  healthMetrics: mockHealthMetrics,
  appointments: mockAppointments,
  riskAssessment: mockRiskAssessment,
  notifications: mockNotifications,
};
