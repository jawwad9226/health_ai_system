import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Divider,
} from '@mui/material';
import {
  FavoriteOutlined,
  DirectionsRunOutlined,
  MonitorWeightOutlined,
  NightsStayOutlined,
} from '@mui/icons-material';
import { HealthRecord } from '../../types';

interface HealthOverviewProps {
  healthRecord: HealthRecord | null;
}

const HealthOverview: React.FC<HealthOverviewProps> = ({ healthRecord }) => {
  if (!healthRecord) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Health Overview
        </Typography>
        <Typography color="text.secondary">
          No health data available. Please update your health information.
        </Typography>
      </Paper>
    );
  }

  const {
    health_data: {
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      weight,
      height,
      exerciseFrequency,
      sleepDuration,
    },
  } = healthRecord;

  const bmi = weight / ((height / 100) * (height / 100));

  const healthMetrics = [
    {
      icon: <FavoriteOutlined color="error" />,
      title: 'Heart Health',
      values: [
        {
          label: 'Blood Pressure',
          value: `${bloodPressureSystolic}/${bloodPressureDiastolic} mmHg`,
        },
        {
          label: 'Heart Rate',
          value: `${heartRate} bpm`,
        },
      ],
    },
    {
      icon: <MonitorWeightOutlined color="primary" />,
      title: 'Body Metrics',
      values: [
        {
          label: 'Weight',
          value: `${weight} kg`,
        },
        {
          label: 'BMI',
          value: bmi.toFixed(1),
        },
      ],
    },
    {
      icon: <DirectionsRunOutlined color="success" />,
      title: 'Activity',
      values: [
        {
          label: 'Exercise',
          value: `${exerciseFrequency} days/week`,
        },
      ],
    },
    {
      icon: <NightsStayOutlined color="info" />,
      title: 'Sleep',
      values: [
        {
          label: 'Duration',
          value: `${sleepDuration} hours`,
        },
      ],
    },
  ];

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Health Overview
      </Typography>
      <Grid container spacing={3}>
        {healthMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} key={metric.title}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {metric.icon}
              <Typography variant="subtitle1" sx={{ ml: 1 }}>
                {metric.title}
              </Typography>
            </Box>
            {metric.values.map((value, vIndex) => (
              <Box key={value.label} sx={{ ml: 4, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {value.label}
                </Typography>
                <Typography variant="body1">
                  {value.value}
                </Typography>
              </Box>
            ))}
            {index < healthMetrics.length - 1 && (
              <Divider sx={{ my: 2 }} />
            )}
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default HealthOverview;
