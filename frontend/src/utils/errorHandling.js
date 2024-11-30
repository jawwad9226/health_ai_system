import React from 'react';

// Error handling utilities
export const logError = (error, errorInfo = null) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }
  }

  // Here you can add integration with error tracking services
  // like Sentry, LogRocket, etc.
};

export const isNetworkError = (error) => {
  return (
    !window.navigator.onLine ||
    error.message === 'Network Error' ||
    error.message === 'Failed to fetch'
  );
};

export const getErrorMessage = (error) => {
  if (isNetworkError(error)) {
    return 'Network error. Please check your internet connection.';
  }

  if (error.response) {
    // Handle API errors
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  return error.message || 'An unexpected error occurred.';
};

export const handleApiError = async (error) => {
  const errorMessage = getErrorMessage(error);
  logError(error);

  // Handle token expiration
  if (error.response?.status === 401) {
    // Redirect to login or refresh token
    window.location.href = '/login';
  }

  return {
    error: true,
    message: errorMessage
  };
};

export const withErrorBoundary = (WrappedComponent) => {
  return class ErrorBoundaryHOC extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      logError(error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="error-boundary-fallback">
            <h2>Something went wrong</h2>
            <p>{getErrorMessage(this.state.error)}</p>
            <button onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};
