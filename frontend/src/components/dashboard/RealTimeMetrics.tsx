import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../hooks/useWebSocket';

interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface RealTimeMetricsProps {
  websocketUrl: string;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ websocketUrl }) => {
  const {
    data,
    isConnected,
    error,
    reconnectCount,
  } = useWebSocket<HealthMetric[]>({
    url: websocketUrl,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  const [metrics, setMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    if (data) {
      setMetrics(data);
    }
  }, [data]);

  const getStatusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'critical':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'normal':
        return 'success.main';
      default:
        return 'text.primary';
    }
  };

  const getTrendIcon = (trend: HealthMetric['trend']) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Connection error. Attempting to reconnect... (Attempt {reconnectCount}/5)
        </Alert>
      )}

      {!isConnected && !error && (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      )}

      <AnimatePresence mode="wait">
        <Grid container spacing={2}>
          {metrics.map((metric) => (
            <Grid item xs={12} sm={6} md={4} key={metric.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {metric.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="h4"
                        color={getStatusColor(metric.status)}
                      >
                        {metric.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {metric.unit}
                      </Typography>
                      <Typography
                        variant="h6"
                        color={getStatusColor(metric.status)}
                        sx={{ ml: 'auto' }}
                      >
                        {getTrendIcon(metric.trend)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Last updated: {new Date(metric.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </AnimatePresence>
    </Box>
  );
};

export default RealTimeMetrics;
