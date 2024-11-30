import React from 'react';
import { Box, Typography, useTheme, Paper, Grid } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface DataPoint {
  date: string;
  value: number;
}

interface TrendData {
  metric: string;
  data: DataPoint[];
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
}

interface TrendAnalysisProps {
  trends: TrendData[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ trends }) => {
  const theme = useTheme();

  const formatDataForChart = (data: DataPoint[]) => {
    return data.map(point => ({
      x: new Date(point.date),
      y: point.value,
    }));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return <TrendingFlatIcon color="action" />;
    }
  };

  const renderTrendCard = (trendData: TrendData) => (
    <Grid item xs={12} md={6} lg={4}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{trendData.metric}</Typography>
            {getTrendIcon(trendData.trend)}
          </Box>
          
          <Box sx={{ height: 200 }}>
            <ResponsiveLine
              data={[
                {
                  id: trendData.metric,
                  data: formatDataForChart(trendData.data),
                },
              ]}
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              xScale={{
                type: 'time',
                format: 'native',
              }}
              yScale={{
                type: 'linear',
                min: 'auto',
                max: 'auto',
              }}
              axisBottom={{
                format: '%b %d',
                tickRotation: -45,
              }}
              curve="monotoneX"
              enablePoints={false}
              enableGridX={false}
              enableArea={true}
              areaOpacity={0.1}
              colors={[theme.palette.primary.main]}
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fontSize: 10,
                    },
                  },
                },
                grid: {
                  line: {
                    stroke: theme.palette.divider,
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Change
            </Typography>
            <Typography
              variant="body1"
              color={
                trendData.trend === 'up'
                  ? 'success.main'
                  : trendData.trend === 'down'
                  ? 'error.main'
                  : 'text.primary'
              }
            >
              {trendData.change > 0 ? '+' : ''}
              {trendData.change}
              {trendData.unit}
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Grid>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Health Trends Analysis
      </Typography>
      <Grid container spacing={3}>
        {trends.map((trend, index) => renderTrendCard(trend))}
      </Grid>
    </Box>
  );
};

export default TrendAnalysis;
