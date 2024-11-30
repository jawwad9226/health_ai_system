import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Paper,
  Grid,
} from '@mui/material';

export interface MetricsConfiguration {
  updateInterval: number;
  aggregationType: 'none' | 'average' | 'max' | 'min';
  timeWindow: number;
  showTrends: boolean;
  criticalThreshold: number;
  warningThreshold: number;
  selectedMetrics: string[];
}

interface MetricsConfigProps {
  config: MetricsConfiguration;
  onChange: (config: MetricsConfiguration) => void;
  availableMetrics: Array<{ id: string; name: string }>;
}

const MetricsConfig: React.FC<MetricsConfigProps> = ({
  config,
  onChange,
  availableMetrics,
}) => {
  const handleChange = (field: keyof MetricsConfiguration, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Metrics Configuration
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Aggregation Type</InputLabel>
            <Select
              value={config.aggregationType}
              label="Aggregation Type"
              onChange={(e) => handleChange('aggregationType', e.target.value)}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="average">Average</MenuItem>
              <MenuItem value="max">Maximum</MenuItem>
              <MenuItem value="min">Minimum</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>
              Update Interval (ms)
            </Typography>
            <Slider
              value={config.updateInterval}
              min={1000}
              max={60000}
              step={1000}
              onChange={(_, value) => handleChange('updateInterval', value)}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value / 1000}s`}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>
              Time Window (minutes)
            </Typography>
            <Slider
              value={config.timeWindow}
              min={1}
              max={60}
              onChange={(_, value) => handleChange('timeWindow', value)}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}m`}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography gutterBottom>Thresholds</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Critical"
                  type="number"
                  value={config.criticalThreshold}
                  onChange={(e) =>
                    handleChange('criticalThreshold', Number(e.target.value))
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Warning"
                  type="number"
                  value={config.warningThreshold}
                  onChange={(e) =>
                    handleChange('warningThreshold', Number(e.target.value))
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Selected Metrics</InputLabel>
            <Select
              multiple
              value={config.selectedMetrics}
              label="Selected Metrics"
              onChange={(e) => handleChange('selectedMetrics', e.target.value)}
              renderValue={(selected) =>
                selected
                  .map(
                    (id) =>
                      availableMetrics.find((metric) => metric.id === id)?.name
                  )
                  .join(', ')
              }
            >
              {availableMetrics.map((metric) => (
                <MenuItem key={metric.id} value={metric.id}>
                  {metric.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={config.showTrends}
                onChange={(e) => handleChange('showTrends', e.target.checked)}
              />
            }
            label="Show Trends"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MetricsConfig;
