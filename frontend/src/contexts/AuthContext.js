import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as healthApi from '../api/healthApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setError(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await healthApi.fetchUserProfile();
      setUser(response.data);
      return true;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      clearAuth();
      return false;
    }
  }, [clearAuth]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetchUserProfile();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUserProfile, clearAuth]);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await healthApi.login(credentials);
      const { token, refresh_token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }
      
      setUser(userData);

      // Redirect based on user role
      if (userData.role === 'professional') {
        navigate('/dashboard/professional');
      } else {
        navigate('/dashboard/patient');
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await healthApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
