import { HealthMetric } from '../types/metrics';

export const aggregateMetrics = (
  metrics: HealthMetric[],
  type: 'none' | 'average' | 'max' | 'min',
  timeWindow: number
): HealthMetric[] => {
  if (type === 'none') return metrics;

  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindow * 60 * 1000);

  // Group metrics by name within time window
  const groupedMetrics = metrics
    .filter(metric => new Date(metric.timestamp) >= windowStart)
    .reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, HealthMetric[]>);

  return Object.entries(groupedMetrics).map(([name, values]) => {
    const latestMetric = values[values.length - 1];
    let aggregatedValue: number;

    switch (type) {
      case 'average':
        aggregatedValue = values.reduce((sum, m) => sum + m.value, 0) / values.length;
        break;
      case 'max':
        aggregatedValue = Math.max(...values.map(m => m.value));
        break;
      case 'min':
        aggregatedValue = Math.min(...values.map(m => m.value));
        break;
      default:
        aggregatedValue = latestMetric.value;
    }

    // Calculate trend based on aggregated values
    const trend = calculateTrend(values.map(m => m.value));

    // Determine status based on thresholds
    const status = determineStatus(aggregatedValue, latestMetric.status);

    return {
      ...latestMetric,
      value: aggregatedValue,
      trend,
      status,
      timestamp: now.toISOString(),
    };
  });
};

const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
  if (values.length < 2) return 'stable';

  const recentValues = values.slice(-3); // Look at last 3 values
  const firstValue = recentValues[0];
  const lastValue = recentValues[recentValues.length - 1];
  const difference = lastValue - firstValue;
  const threshold = 0.05; // 5% change threshold

  if (Math.abs(difference) / firstValue < threshold) {
    return 'stable';
  }
  return difference > 0 ? 'up' : 'down';
};

const determineStatus = (
  value: number,
  previousStatus: HealthMetric['status']
): HealthMetric['status'] => {
  // This is a placeholder implementation
  // In a real application, this would use the configured thresholds
  // and possibly more sophisticated logic
  return previousStatus;
};

export const filterMetricsByTimeRange = (
  metrics: HealthMetric[],
  startTime: Date,
  endTime: Date
): HealthMetric[] => {
  return metrics.filter(metric => {
    const timestamp = new Date(metric.timestamp);
    return timestamp >= startTime && timestamp <= endTime;
  });
};

export const filterMetricsByIds = (
  metrics: HealthMetric[],
  selectedIds: string[]
): HealthMetric[] => {
  if (!selectedIds.length) return metrics;
  return metrics.filter(metric => selectedIds.includes(metric.id));
};

export const applyThresholds = (
  metrics: HealthMetric[],
  criticalThreshold: number,
  warningThreshold: number
): HealthMetric[] => {
  return metrics.map(metric => ({
    ...metric,
    status: determineStatusByThresholds(
      metric.value,
      criticalThreshold,
      warningThreshold
    ),
  }));
};

const determineStatusByThresholds = (
  value: number,
  criticalThreshold: number,
  warningThreshold: number
): HealthMetric['status'] => {
  if (value >= criticalThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'normal';
};
