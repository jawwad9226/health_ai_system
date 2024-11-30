import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Slider,
  InputAdornment,
} from '@mui/material';
import { useHealth } from '../../context/HealthContext';

interface HealthFormData {
  age: number;
  gender: string;
  height: number;
  weight: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  exerciseFrequency: number;
  sleepDuration: number;
  medicalConditions: {
    diabetes: boolean;
    hypertension: boolean;
    asthma: boolean;
  };
  notes: string;
}

const initialFormData: HealthFormData = {
  age: 30,
  gender: '',
  height: 170,
  weight: 70,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 70,
  exerciseFrequency: 3,
  sleepDuration: 7,
  medicalConditions: {
    diabetes: false,
    hypertension: false,
    asthma: false,
  },
  notes: '',
};

const HealthRecordForm: React.FC = () => {
  const navigate = useNavigate();
  const { createHealthRecord, loading, error } = useHealth();
  const [formData, setFormData] = useState<HealthFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConditionChange = (condition: keyof typeof initialFormData.medicalConditions) => {
    setFormData((prev) => ({
      ...prev,
      medicalConditions: {
        ...prev.medicalConditions,
        [condition]: !prev.medicalConditions[condition],
      },
    }));
  };

  const handleSliderChange = (name: string) => (event: Event, newValue: number | number[]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHealthRecord(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error submitting health record:', err);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Health Record Update
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleInputChange}
              InputProps={{
                inputProps: { min: 0, max: 120 },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Gender"
              name="gender"
              select
              SelectProps={{ native: true }}
              value={formData.gender}
              onChange={handleInputChange}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Height"
              name="height"
              type="number"
              value={formData.height}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                inputProps: { min: 0, max: 300 },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Weight"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                inputProps: { min: 0, max: 500 },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Blood Pressure (Systolic)"
              name="bloodPressureSystolic"
              type="number"
              value={formData.bloodPressureSystolic}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                inputProps: { min: 0, max: 300 },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Blood Pressure (Diastolic)"
              name="bloodPressureDiastolic"
              type="number"
              value={formData.bloodPressureDiastolic}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                inputProps: { min: 0, max: 200 },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Heart Rate"
              name="heartRate"
              type="number"
              value={formData.heartRate}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                inputProps: { min: 0, max: 220 },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>
              Exercise Frequency (days per week)
            </Typography>
            <Slider
              value={formData.exerciseFrequency}
              onChange={handleSliderChange('exerciseFrequency')}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={0}
              max={7}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>
              Sleep Duration (hours)
            </Typography>
            <Slider
              value={formData.sleepDuration}
              onChange={handleSliderChange('sleepDuration')}
              valueLabelDisplay="auto"
              step={0.5}
              marks
              min={4}
              max={12}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Medical Conditions
            </Typography>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.medicalConditions.diabetes}
                    onChange={() => handleConditionChange('diabetes')}
                  />
                }
                label="Diabetes"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.medicalConditions.hypertension}
                    onChange={() => handleConditionChange('hypertension')}
                  />
                }
                label="Hypertension"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.medicalConditions.asthma}
                    onChange={() => handleConditionChange('asthma')}
                  />
                }
                label="Asthma"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Notes"
              name="notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Save Health Record
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default HealthRecordForm;
