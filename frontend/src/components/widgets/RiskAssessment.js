import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

const RiskAssessment = ({ data }) => {
  const theme = useTheme();

  if (!data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  const getRiskColor = (level) => {
    switch (level.toLowerCase()) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getRiskIcon = (level) => {
    switch (level.toLowerCase()) {
      case 'high':
        return <Warning color="error" />;
      case 'medium':
        return <Info color="warning" />;
      case 'low':
        return <CheckCircle color="success" />;
      default:
        return <Info color="info" />;
    }
  };

  return (
    <Box>
      {/* Overall Risk Level */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        mb={3}
      >
        <Typography variant="h6" gutterBottom>
          Overall Risk Level
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            bgcolor: getRiskColor(data.risk_level) + '20',
            p: 2,
            borderRadius: 2,
          }}
        >
          {getRiskIcon(data.risk_level)}
          <Typography
            variant="h5"
            sx={{ ml: 1, color: getRiskColor(data.risk_level) }}
          >
            {data.risk_level.toUpperCase()}
          </Typography>
        </Box>
      </Box>

      {/* Risk Factors */}
      <Typography variant="subtitle1" gutterBottom>
        Key Risk Factors
      </Typography>
      <List dense>
        {data.risk_factors.map((factor, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {factor.trend === 'up' ? (
                <TrendingUp color="error" />
              ) : (
                <TrendingDown color="success" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={factor.name}
              secondary={factor.description}
            />
            <Chip
              label={factor.severity}
              size="small"
              sx={{
                bgcolor: getRiskColor(factor.severity) + '20',
                color: getRiskColor(factor.severity),
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Recommendations */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Recommendations
      </Typography>
      <List dense>
        {data.recommendations.map((recommendation, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <Info color="info" />
            </ListItemIcon>
            <ListItemText
              primary={recommendation.title}
              secondary={recommendation.description}
            />
          </ListItem>
        ))}
      </List>

      {/* Confidence Score */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        mt={2}
        sx={{ opacity: 0.7 }}
      >
        <Typography variant="body2" color="textSecondary">
          Confidence Score: {(data.confidence_score * 100).toFixed(1)}%
        </Typography>
      </Box>
    </Box>
  );
};

export default RiskAssessment;
