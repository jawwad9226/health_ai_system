import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Card,
  CardContent,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Timeline,
  Assessment,
  LocalHospital,
  Event,
  Notifications,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { fetchPatientData, fetchVitalSigns, fetchAppointments } from '../api/healthApi';
import VitalSignsChart from './charts/VitalSignsChart';
import AppointmentList from './lists/AppointmentList';
import RiskAssessment from './widgets/RiskAssessment';
import HealthMetrics from './widgets/HealthMetrics';
import AlertsNotifications from './widgets/AlertsNotifications';

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch patient data
        const patientResponse = await fetchPatientData(user.id);
        setPatientData(patientResponse.data);
        
        // Fetch vital signs
        const vitalsResponse = await fetchVitalSigns(user.id);
        setVitalSigns(vitalsResponse.data);
        
        // Fetch appointments
        const appointmentsResponse = await fetchAppointments(user.id);
        setAppointments(appointmentsResponse.data);
        
        // Fetch health metrics and risk assessment
        const metricsResponse = await fetchHealthMetrics(user.id);
        setHealthMetrics(metricsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user.id]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome back, {patientData?.name}
            </Typography>
            <Typography variant="subtitle1">
              Here's your health summary for today
            </Typography>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Next Appointment
              </Typography>
              <Typography variant="h5" component="div">
                {appointments[0]?.date || 'No upcoming appointments'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Risk Level
              </Typography>
              <Typography variant="h5" component="div">
                {healthMetrics?.riskLevel || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Medications
              </Typography>
              <Typography variant="h5" component="div">
                {patientData?.activeMedications?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Actions
              </Typography>
              <Typography variant="h5" component="div">
                {alerts.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Vital Signs Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" gutterBottom>
                Vital Signs Trend
              </Typography>
              <IconButton>
                <TrendingUp />
              </IconButton>
            </Box>
            <VitalSignsChart data={vitalSigns} />
          </Paper>
        </Grid>

        {/* Risk Assessment */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" gutterBottom>
                Risk Assessment
              </Typography>
              <IconButton>
                <Assessment />
              </IconButton>
            </Box>
            <RiskAssessment data={healthMetrics?.riskAssessment} />
          </Paper>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" gutterBottom>
                Upcoming Appointments
              </Typography>
              <IconButton>
                <Event />
              </IconButton>
            </Box>
            <AppointmentList appointments={appointments} />
          </Paper>
        </Grid>

        {/* Health Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" gutterBottom>
                Health Metrics
              </Typography>
              <IconButton>
                <LocalHospital />
              </IconButton>
            </Box>
            <HealthMetrics data={healthMetrics} />
          </Paper>
        </Grid>

        {/* Alerts and Notifications */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" gutterBottom>
                Alerts & Notifications
              </Typography>
              <IconButton>
                <Notifications />
              </IconButton>
            </Box>
            <AlertsNotifications alerts={alerts} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
