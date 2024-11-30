import React, { createContext, useContext, useState } from 'react';
import { PredictionState, RiskPrediction } from '../types';
import { predictionsAPI } from '../services/api';

interface PredictionContextType extends PredictionState {
  fetchLatestPrediction: () => Promise<void>;
  fetchPredictionHistory: (days?: number) => Promise<void>;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export const PredictionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PredictionState>({
    currentPrediction: null,
    history: [],
    loading: false,
    error: null,
  });

  const fetchLatestPrediction = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await predictionsAPI.getLatest();
      setState(prev => ({
        ...prev,
        currentPrediction: response.data,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to fetch latest prediction',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchPredictionHistory = async (days = 30) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await predictionsAPI.getHistory(days);
      setState(prev => ({
        ...prev,
        history: response.data.predictions,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to fetch prediction history',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <PredictionContext.Provider
      value={{
        ...state,
        fetchLatestPrediction,
        fetchPredictionHistory,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
};

export const usePrediction = () => {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
};
