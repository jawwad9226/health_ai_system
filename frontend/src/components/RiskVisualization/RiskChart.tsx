import React from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { RiskPrediction } from '../../types';

interface RiskChartProps {
  prediction: RiskPrediction | null;
}

const RiskChart: React.FC<RiskChartProps> = ({ prediction }) => {
  const theme = useTheme();

  if (!prediction) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          No risk prediction data available
        </Typography>
      </Paper>
    );
  }

  const data = [
    {
      subject: 'Cardiovascular',
      risk: prediction.risk_factors.cardiovascular,
      fullMark: 100,
    },
    {
      subject: 'Diabetes',
      risk: prediction.risk_factors.diabetes,
      fullMark: 100,
    },
    {
      subject: 'Mental Health',
      risk: prediction.risk_factors.mental_health,
      fullMark: 100,
    },
    {
      subject: 'Lifestyle',
      risk: prediction.risk_factors.lifestyle,
      fullMark: 100,
    },
  ];

  const getRiskColor = (value: number) => {
    if (value <= 25) return theme.palette.success.main;
    if (value <= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Risk Assessment Visualization
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: theme.palette.text.secondary }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: theme.palette.text.secondary }}
            />
            <Radar
              name="Risk Level"
              dataKey="risk"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.6}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value}%`,
                'Risk Level',
              ]}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
              labelStyle={{
                color: theme.palette.text.primary,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Overall Risk: {prediction.overall_risk}%
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: 8,
            bgcolor: 'grey.200',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${prediction.overall_risk}%`,
              height: '100%',
              bgcolor: getRiskColor(prediction.overall_risk),
              transition: 'width 0.5s ease-in-out',
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default RiskChart;
