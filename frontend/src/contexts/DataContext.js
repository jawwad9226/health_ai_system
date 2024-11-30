import React, { createContext, useContext, useState, useCallback } from 'react';
import * as healthApi from '../api/healthApi';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [data, setData] = useState({
    appointments: [],
    medicalRecords: [],
    prescriptions: [],
    vitalSigns: [],
    riskAssessment: null,
    healthMetrics: null,
    alerts: [],
  });

  // Generic data fetching function
  const fetchData = useCallback(async (dataType, fetchFunction, params = {}) => {
    setLoading((prev) => ({ ...prev, [dataType]: true }));
    setError((prev) => ({ ...prev, [dataType]: null }));

    try {
      const response = await fetchFunction(params);
      setData((prev) => ({ ...prev, [dataType]: response.data }));
      return response.data;
    } catch (err) {
      const error = healthApi.handleApiError(err);
      setError((prev) => ({ ...prev, [dataType]: error.message }));
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, [dataType]: false }));
    }
  }, []);

  // Appointments
  const fetchAppointments = useCallback((params) => {
    return fetchData('appointments', () => healthApi.fetchAppointments(params));
  }, [fetchData]);

  const createAppointment = useCallback(async (data) => {
    const response = await healthApi.createAppointment(data);
    setData((prev) => ({
      ...prev,
      appointments: [...prev.appointments, response.data],
    }));
    return response.data;
  }, []);

  // Medical Records
  const fetchMedicalRecords = useCallback((params) => {
    return fetchData('medicalRecords', () => healthApi.fetchMedicalRecords(params));
  }, [fetchData]);

  const createMedicalRecord = useCallback(async (data) => {
    const response = await healthApi.createMedicalRecord(data);
    setData((prev) => ({
      ...prev,
      medicalRecords: [...prev.medicalRecords, response.data],
    }));
    return response.data;
  }, []);

  // Vital Signs
  const fetchVitalSigns = useCallback((params) => {
    return fetchData('vitalSigns', () => healthApi.fetchVitalSigns(params));
  }, [fetchData]);

  const recordVitalSign = useCallback(async (data) => {
    const response = await healthApi.recordVitalSign(data);
    setData((prev) => ({
      ...prev,
      vitalSigns: [...prev.vitalSigns, response.data],
    }));
    return response.data;
  }, []);

  // Risk Assessment
  const fetchRiskAssessment = useCallback(() => {
    if (!user) return;
    return fetchData('riskAssessment', () => healthApi.performRiskAssessment(user.id));
  }, [fetchData, user]);

  // Health Metrics
  const fetchHealthMetrics = useCallback(() => {
    if (!user) return;
    return fetchData('healthMetrics', () => healthApi.fetchVitalSignStats(user.id));
  }, [fetchData, user]);

  // Alerts & Notifications
  const fetchAlerts = useCallback((params) => {
    return fetchData('alerts', () => healthApi.fetchAlerts(params));
  }, [fetchData]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    const promises = [
      fetchAppointments(),
      fetchMedicalRecords(),
      fetchVitalSigns(),
      fetchRiskAssessment(),
      fetchHealthMetrics(),
      fetchAlerts(),
    ];

    try {
      await Promise.all(promises);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [
    fetchAppointments,
    fetchMedicalRecords,
    fetchVitalSigns,
    fetchRiskAssessment,
    fetchHealthMetrics,
    fetchAlerts,
  ]);

  const value = {
    data,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    fetchMedicalRecords,
    createMedicalRecord,
    fetchVitalSigns,
    recordVitalSign,
    fetchRiskAssessment,
    fetchHealthMetrics,
    fetchAlerts,
    refreshAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataContext;
