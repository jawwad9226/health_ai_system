export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  metadata?: {
    source?: string;
    category?: string;
    description?: string;
    normalRange?: {
      min: number;
      max: number;
    };
  };
}

export interface MetricsFilter {
  timeRange: {
    start: Date;
    end: Date;
  };
  selectedMetricIds: string[];
  categories?: string[];
  sources?: string[];
}

export interface AggregationConfig {
  type: 'none' | 'average' | 'max' | 'min';
  timeWindow: number; // in minutes
  thresholds: {
    critical: number;
    warning: number;
  };
}
