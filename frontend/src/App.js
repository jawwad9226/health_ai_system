import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/layout/Navigation';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';
import PredictionForm from './components/predictions/PredictionForm';
import Profile from './components/profile/Profile';
import { withErrorBoundary } from './utils/errorHandling';
import { AuthProvider, useAuth } from './context/AuthContext';

// Wrap each component with error boundary
const DashboardWithError = withErrorBoundary(Dashboard);
const PredictionFormWithError = withErrorBoundary(PredictionForm);
const ProfileWithError = withErrorBoundary(Profile);
const LoginFormWithError = withErrorBoundary(LoginForm);

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <Navigation />
      {children}
    </>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />
            ) : (
              <LoginFormWithError />
            )
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navigate to="/dashboard" replace />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardWithError />
            </PrivateRoute>
          }
        />
        <Route
          path="/predictions"
          element={
            <PrivateRoute>
              <PredictionFormWithError />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfileWithError />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default withErrorBoundary(App);
