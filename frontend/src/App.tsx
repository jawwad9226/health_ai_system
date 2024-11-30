import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { HealthProvider } from './context/HealthContext';
import { PredictionProvider } from './context/PredictionContext';
import { RecommendationProvider } from './context/RecommendationContext';
import theme from './theme';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import HealthRecordForm from './components/health/HealthRecordForm';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HealthProvider>
          <PredictionProvider>
            <RecommendationProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<Layout />}>
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/health-record/new"
                    element={
                      <PrivateRoute>
                        <HealthRecordForm />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </RecommendationProvider>
          </PredictionProvider>
        </HealthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
