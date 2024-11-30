import React from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  FavoriteOutlined,
  LocalHospitalOutlined,
  PsychologyOutlined,
  DirectionsRunOutlined,
} from '@mui/icons-material';
import { RiskPrediction } from '../../types';

interface RiskPredictionCardProps {
  prediction: RiskPrediction | null;
}

const RiskPredictionCard: React.FC<RiskPredictionCardProps> = ({ prediction }) => {
  if (!prediction) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Risk Assessment
        </Typography>
        <Typography color="text.secondary">
          No risk prediction data available.
        </Typography>
      </Paper>
    );
  }

  const riskCategories = [
    {
      key: 'cardiovascular',
      label: 'Cardiovascular',
      icon: <FavoriteOutlined color="error" />,
      value: prediction.risk_factors.cardiovascular,
    },
    {
      key: 'diabetes',
      label: 'Diabetes',
      icon: <LocalHospitalOutlined color="warning" />,
      value: prediction.risk_factors.diabetes,
    },
    {
      key: 'mental_health',
      label: 'Mental Health',
      icon: <PsychologyOutlined color="info" />,
      value: prediction.risk_factors.mental_health,
    },
    {
      key: 'lifestyle',
      label: 'Lifestyle',
      icon: <DirectionsRunOutlined color="success" />,
      value: prediction.risk_factors.lifestyle,
    },
  ];

  const getRiskLevel = (value: number) => {
    if (value <= 25) return { color: 'success.main', label: 'Low' };
    if (value <= 50) return { color: 'warning.main', label: 'Moderate' };
    return { color: 'error.main', label: 'High' };
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Risk Assessment
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1">Overall Risk</Typography>
          <Typography variant="subtitle1" color={getRiskLevel(prediction.overall_risk).color}>
            {getRiskLevel(prediction.overall_risk).label}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={prediction.overall_risk}
          color={getRiskLevel(prediction.overall_risk).color.split('.')[0] as 'success' | 'warning' | 'error'}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>

      <Grid container spacing={2}>
        {riskCategories.map((category) => (
          <Grid item xs={12} key={category.key}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {category.icon}
              <Typography variant="body1" sx={{ ml: 1 }}>
                {category.label}
              </Typography>
              <Typography
                variant="body2"
                color={getRiskLevel(category.value).color}
                sx={{ ml: 'auto' }}
              >
                {category.value}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={category.value}
              color={getRiskLevel(category.value).color.split('.')[0] as 'success' | 'warning' | 'error'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Last updated: {new Date(prediction.created_at).toLocaleDateString()}
      </Typography>
    </Paper>
  );
};

export default RiskPredictionCard;
