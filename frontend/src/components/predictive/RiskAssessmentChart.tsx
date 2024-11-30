import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveBar } from '@nivo/bar';
import { motion } from 'framer-motion';

interface RiskFactor {
  factor: string;
  score: number;
  severity: 'low' | 'moderate' | 'high';
  trend: 'improving' | 'stable' | 'worsening';
}

interface RiskAssessmentChartProps {
  data: RiskFactor[];
  chartType?: 'radar' | 'bar';
}

const RiskAssessmentChart: React.FC<RiskAssessmentChartProps> = ({ 
  data,
  chartType = 'radar'
}) => {
  const theme = useTheme();

  const formatDataForRadar = (data: RiskFactor[]) => {
    return data.map(item => ({
      factor: item.factor,
      risk: item.score,
      severity: item.severity,
    }));
  };

  const formatDataForBar = (data: RiskFactor[]) => {
    return data.map(item => ({
      factor: item.factor,
      value: item.score,
      color: getColorBySeverity(item.severity),
    }));
  };

  const getColorBySeverity = (severity: string) => {
    switch (severity) {
      case 'low':
        return theme.palette.success.main;
      case 'moderate':
        return theme.palette.warning.main;
      case 'high':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const renderRadarChart = () => (
    <Box sx={{ height: 400 }}>
      <ResponsiveRadar
        data={formatDataForRadar(data)}
        keys={['risk']}
        indexBy="factor"
        maxValue={100}
        margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
        curve="linearClosed"
        borderWidth={2}
        borderColor={{ from: 'color' }}
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={36}
        enableDots={true}
        dotSize={10}
        dotColor={{ theme: 'background' }}
        dotBorderWidth={2}
        dotBorderColor={{ from: 'color' }}
        enableDotLabel={true}
        dotLabel="value"
        dotLabelYOffset={-12}
        colors={{ scheme: 'nivo' }}
        fillOpacity={0.25}
        blendMode="multiply"
        animate={true}
        motionConfig="gentle"
        theme={{
          tooltip: {
            container: {
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontSize: '12px',
              borderRadius: '4px',
              boxShadow: theme.shadows[3],
            },
          },
        }}
      />
    </Box>
  );

  const renderBarChart = () => (
    <Box sx={{ height: 400 }}>
      <ResponsiveBar
        data={formatDataForBar(data)}
        keys={['value']}
        indexBy="factor"
        margin={{ top: 50, right: 60, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        colors={({ data }) => data.color}
        animate={true}
        enableLabel={true}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        theme={{
          tooltip: {
            container: {
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontSize: '12px',
              borderRadius: '4px',
              boxShadow: theme.shadows[3],
            },
          },
        }}
      />
    </Box>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Risk Assessment
        </Typography>
        {chartType === 'radar' ? renderRadarChart() : renderBarChart()}
      </Box>
    </motion.div>
  );
};

export default RiskAssessmentChart;
