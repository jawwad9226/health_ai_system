import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Favorite,
  DirectionsRun,
  Restaurant,
  Hotel,
  Info,
} from '@mui/icons-material';

const HealthMetrics = ({ data }) => {
  const theme = useTheme();

  if (!data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  const metrics = [
    {
      name: 'Heart Health',
      value: data.heart_health,
      icon: <Favorite />,
      color: theme.palette.error.main,
      description: 'Based on blood pressure, heart rate, and ECG readings',
    },
    {
      name: 'Physical Activity',
      value: data.physical_activity,
      icon: <DirectionsRun />,
      color: theme.palette.success.main,
      description: 'Daily activity level and exercise tracking',
    },
    {
      name: 'Nutrition',
      value: data.nutrition,
      icon: <Restaurant />,
      color: theme.palette.warning.main,
      description: 'Diet quality and nutritional balance',
    },
    {
      name: 'Sleep Quality',
      value: data.sleep_quality,
      icon: <Hotel />,
      color: theme.palette.info.main,
      description: 'Sleep duration and quality metrics',
    },
  ];

  const getProgressColor = (value) => {
    if (value >= 80) return theme.palette.success.main;
    if (value >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Grid container spacing={2}>
      {metrics.map((metric) => (
        <Grid item xs={12} key={metric.name}>
          <Paper
            sx={{
              p: 2,
              '&:hover': {
                boxShadow: theme.shadows[4],
                transition: 'box-shadow 0.3s ease-in-out',
              },
            }}
          >
            <Box display="flex" alignItems="center" mb={1}>
              <Box
                sx={{
                  color: metric.color,
                  display: 'flex',
                  alignItems: 'center',
                  mr: 1,
                }}
              >
                {metric.icon}
              </Box>
              <Typography variant="subtitle1">{metric.name}</Typography>
              <Box flexGrow={1} />
              <Tooltip title={metric.description}>
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Box display="flex" alignItems="center">
              <Box flexGrow={1} mr={2}>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getProgressColor(metric.value),
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ minWidth: 35 }}
              >
                {metric.value}%
              </Typography>
            </Box>

            {/* Recommendations or Status */}
            {metric.value < 60 && (
              <Typography
                variant="body2"
                color="error"
                sx={{ mt: 1, fontSize: '0.75rem' }}
              >
                Needs improvement - Check recommendations
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}

      {/* Overall Health Score */}
      <Grid item xs={12}>
        <Paper
          sx={{
            p: 2,
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Overall Health Score
          </Typography>
          <Box display="flex" alignItems="center">
            <Box flexGrow={1} mr={2}>
              <LinearProgress
                variant="determinate"
                value={data.overall_score}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                    borderRadius: 5,
                  },
                }}
              />
            </Box>
            <Typography variant="h6">
              {data.overall_score}%
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default HealthMetrics;
