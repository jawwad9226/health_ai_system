import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false
        }));
        return;
      }

      try {
        // Verify token with backend
        const response = await fetch('http://localhost:5000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userData,
            token
          });
        } else {
          // Token is invalid
          localStorage.removeItem('token');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            token: null
          });
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: userData,
      token
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null
    });
  };

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider 
      value={{
        ...authState,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
