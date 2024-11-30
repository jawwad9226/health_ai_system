export interface User {
  id: number;
  email: string;
  name?: string;
  age?: number;
  gender?: string;
  medical_history?: Record<string, any>;
}

export interface HealthRecord {
  id: number;
  age?: number;
  gender?: string;
  health_data: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    weight: number;
    height: number;
    exerciseFrequency: number;
    sleepDuration: number;
    medicalConditions: {
      diabetes: boolean;
      hypertension: boolean;
      asthma: boolean;
    };
  };
  notes?: string;
  created_at: string;
}

export interface RiskPrediction {
  overall_risk: number;
  risk_factors: {
    cardiovascular: number;
    diabetes: number;
    mental_health: number;
    lifestyle: number;
  };
  created_at: string;
}

export interface Recommendation {
  id: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actions: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface HealthState {
  currentRecord: HealthRecord | null;
  history: HealthRecord[];
  loading: boolean;
  error: string | null;
}

export interface PredictionState {
  currentPrediction: RiskPrediction | null;
  history: RiskPrediction[];
  loading: boolean;
  error: string | null;
}

export interface RecommendationState {
  recommendations: Recommendation[];
  history: Recommendation[];
  loading: boolean;
  error: string | null;
}
