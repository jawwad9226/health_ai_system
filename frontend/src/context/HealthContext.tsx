import React, { createContext, useContext, useState } from 'react';
import { HealthState, HealthRecord } from '../types';
import { healthAPI } from '../services/api';

interface HealthContextType extends HealthState {
  createHealthRecord: (data: any) => Promise<void>;
  fetchLatestRecord: () => Promise<void>;
  fetchHistory: (page?: number, perPage?: number) => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<HealthState>({
    currentRecord: null,
    history: [],
    loading: false,
    error: null,
  });

  const createHealthRecord = async (data: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await healthAPI.createRecord(data);
      await fetchLatestRecord();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to create health record',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLatestRecord = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await healthAPI.getLatestRecord();
      setState(prev => ({
        ...prev,
        currentRecord: response.data,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to fetch latest record',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchHistory = async (page = 1, perPage = 10) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await healthAPI.getHistory(page, perPage);
      setState(prev => ({
        ...prev,
        history: response.data.records,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to fetch history',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <HealthContext.Provider
      value={{
        ...state,
        createHealthRecord,
        fetchLatestRecord,
        fetchHistory,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
