import React from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { HealthRecord } from '../../types';

interface HealthTrendsProps {
  history: HealthRecord[];
  timeRange?: '1W' | '1M' | '3M' | '6M' | '1Y';
  onTimeRangeChange?: (range: string) => void;
}

const HealthTrends: React.FC<HealthTrendsProps> = ({
  history,
  timeRange = '1M',
  onTimeRangeChange,
}) => {
  const theme = useTheme();

  const formatData = (records: HealthRecord[]) => {
    return records.map((record) => ({
      date: format(new Date(record.created_at), 'MM/dd/yyyy'),
      systolic: record.health_data.bloodPressureSystolic,
      diastolic: record.health_data.bloodPressureDiastolic,
      heartRate: record.health_data.heartRate,
      weight: record.health_data.weight,
    }));
  };

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: string,
  ) => {
    if (newRange !== null && onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

  const data = formatData(history);

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Health Trends</Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
        >
          <ToggleButton value="1W">1W</ToggleButton>
          <ToggleButton value="1M">1M</ToggleButton>
          <ToggleButton value="3M">3M</ToggleButton>
          <ToggleButton value="6M">6M</ToggleButton>
          <ToggleButton value="1Y">1Y</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: theme.palette.text.secondary }}
            />
            <YAxis tick={{ fill: theme.palette.text.secondary }} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="systolic"
              stroke={theme.palette.primary.main}
              name="Systolic BP"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke={theme.palette.secondary.main}
              name="Diastolic BP"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke={theme.palette.error.main}
              name="Heart Rate"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={theme.palette.success.main}
              name="Weight"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default HealthTrends;
