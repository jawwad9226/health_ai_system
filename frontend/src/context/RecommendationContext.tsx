import React, { createContext, useContext, useState } from 'react';
import { RecommendationState, Recommendation } from '../types';
import { recommendationsAPI } from '../services/api';

interface RecommendationContextType extends RecommendationState {
  fetchRecommendations: () => Promise<void>;
  fetchRecommendationHistory: (page?: number, perPage?: number) => Promise<void>;
  updateRecommendationStatus: (id: number, status: string) => Promise<void>;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export const RecommendationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RecommendationState>({
    recommendations: [],
    history: [],
    loading: false,
    error: null,
  });

  const fetchRecommendations = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await recommendationsAPI.getRecommendations();
      setState(prev => ({
        ...prev,
        recommendations: response.data.recommendations,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to fetch recommendations',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchRecommendationHistory = async (page = 1, perPage = 10) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await recommendationsAPI.getHistory(page, perPage);
      setState(prev => ({
        ...prev,
        history: response.data.recommendations,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to fetch recommendation history',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateRecommendationStatus = async (id: number, status: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await recommendationsAPI.updateStatus(id, status);
      
      // Update the recommendation in the local state
      setState(prev => ({
        ...prev,
        recommendations: prev.recommendations.map(rec =>
          rec.id === id ? { ...rec, status } : rec
        ),
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to update recommendation status',
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <RecommendationContext.Provider
      value={{
        ...state,
        fetchRecommendations,
        fetchRecommendationHistory,
        updateRecommendationStatus,
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
};

export const useRecommendation = () => {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error('useRecommendation must be used within a RecommendationProvider');
  }
  return context;
};
