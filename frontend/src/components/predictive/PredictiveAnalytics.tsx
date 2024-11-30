import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import RiskAssessmentChart from './RiskAssessmentChart';
import TrendAnalysis from './TrendAnalysis';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';

interface PredictiveAnalyticsProps {
  riskData: Array<{
    factor: string;
    score: number;
    severity: 'low' | 'moderate' | 'high';
    trend: 'improving' | 'stable' | 'worsening';
  }>;
  trendData: Array<{
    metric: string;
    data: Array<{ date: string; value: number }>;
    trend: 'up' | 'down' | 'stable';
    change: number;
    unit: string;
  }>;
  loading?: boolean;
  error?: string;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  riskData,
  trendData,
  loading = false,
  error,
}) => {
  const [view, setView] = useState<'risk' | 'trends'>('risk');
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'risk' | 'trends' | null
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'radar' | 'bar' | null
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Predictive Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="risk">
              <AssessmentIcon sx={{ mr: 1 }} />
              Risk Assessment
            </ToggleButton>
            <ToggleButton value="trends">
              <TimelineIcon sx={{ mr: 1 }} />
              Trends
            </ToggleButton>
          </ToggleButtonGroup>

          {view === 'risk' && (
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
            >
              <ToggleButton value="radar">
                <ShowChartIcon />
              </ToggleButton>
              <ToggleButton value="bar">
                <BarChartIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {view === 'risk' ? (
            <RiskAssessmentChart data={riskData} chartType={chartType} />
          ) : (
            <TrendAnalysis trends={trendData} />
          )}
        </motion.div>
      </AnimatePresence>
    </Paper>
  );
};

export default PredictiveAnalytics;
