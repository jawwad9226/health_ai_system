import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
} from '@mui/material';
import { useHealth } from '../../context/HealthContext';

const HealthRecordForm: React.FC = () => {
  const navigate = useNavigate();
  const { createHealthRecord } = useHealth();
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    weight: '',
    height: '',
    exerciseFrequency: '',
    sleepDuration: '',
    medicalConditions: {
      diabetes: false,
      hypertension: false,
      asthma: false,
    },
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      medicalConditions: {
        ...prev.medicalConditions,
        [name]: checked,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHealthRecord({
        health_data: {
          ...formData,
          bloodPressureSystolic: parseInt(formData.bloodPressureSystolic),
          bloodPressureDiastolic: parseInt(formData.bloodPressureDiastolic),
          heartRate: parseInt(formData.heartRate),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          exerciseFrequency: parseInt(formData.exerciseFrequency),
          sleepDuration: parseFloat(formData.sleepDuration),
        },
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create health record');
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Update Health Information
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Systolic Blood Pressure"
              name="bloodPressureSystolic"
              type="number"
              value={formData.bloodPressureSystolic}
              onChange={handleChange}
              inputProps={{ min: 70, max: 200 }}
              helperText="mmHg (70-200)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Diastolic Blood Pressure"
              name="bloodPressureDiastolic"
              type="number"
              value={formData.bloodPressureDiastolic}
              onChange={handleChange}
              inputProps={{ min: 40, max: 130 }}
              helperText="mmHg (40-130)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Heart Rate"
              name="heartRate"
              type="number"
              value={formData.heartRate}
              onChange={handleChange}
              inputProps={{ min: 40, max: 200 }}
              helperText="bpm (40-200)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Weight"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              inputProps={{ min: 30, max: 300, step: 0.1 }}
              helperText="kg (30-300)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Height"
              name="height"
              type="number"
              value={formData.height}
              onChange={handleChange}
              inputProps={{ min: 100, max: 250 }}
              helperText="cm (100-250)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Exercise Frequency"
              name="exerciseFrequency"
              type="number"
              value={formData.exerciseFrequency}
              onChange={handleChange}
              inputProps={{ min: 0, max: 7 }}
              helperText="days per week (0-7)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Sleep Duration"
              name="sleepDuration"
              type="number"
              value={formData.sleepDuration}
              onChange={handleChange}
              inputProps={{ min: 0, max: 24, step: 0.5 }}
              helperText="hours per day (0-24)"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Medical Conditions
            </Typography>
            <Grid container>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.medicalConditions.diabetes}
                      onChange={handleCheckboxChange}
                      name="diabetes"
                    />
                  }
                  label="Diabetes"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.medicalConditions.hypertension}
                      onChange={handleCheckboxChange}
                      name="hypertension"
                    />
                  }
                  label="Hypertension"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.medicalConditions.asthma}
                      onChange={handleCheckboxChange}
                      name="asthma"
                    />
                  }
                  label="Asthma"
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Notes"
              name="notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
              >
                Save Health Record
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default HealthRecordForm;
