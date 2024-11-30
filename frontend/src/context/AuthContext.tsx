import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('token'),
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: response.data,
      }));
    } catch (error) {
      localStorage.removeItem('token');
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, user_id } = response.data;
      localStorage.setItem('token', access_token);
      setState({
        isAuthenticated: true,
        user: { id: user_id, email } as User,
        token: access_token,
      });
      await loadUser();
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      await authAPI.register(data);
      await login(data.email, data.password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await authAPI.updateProfile(data);
      setState(prev => ({
        ...prev,
        user: response.data,
      }));
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
