import { toast } from 'react-toastify';

export class ApiError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    const message = data.message || 'An error occurred';
    const errors = data.errors || null;

    // Handle specific status codes
    switch (status) {
      case 400:
        toast.error('Invalid request. Please check your input.');
        break;
      case 401:
        toast.error('Session expired. Please log in again.');
        // Optionally trigger logout or refresh token
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('The requested resource was not found.');
        break;
      case 422:
        toast.error('Validation error. Please check your input.');
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Internal server error. Please try again later.');
        break;
      default:
        toast.error(message);
    }

    return new ApiError(status, message, errors);
  }

  if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.');
    return new ApiError(503, 'Network error');
  }

  // Error setting up request
  toast.error('Application error. Please try again.');
  return new ApiError(500, error.message);
};

export const handlePromiseRejection = (error) => {
  console.error('Unhandled Promise Rejection:', error);
  toast.error('An unexpected error occurred. Our team has been notified.');
  
  // Here you would typically log to your error reporting service
  // errorReportingService.log(error);
};

// Set up global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  handlePromiseRejection(event.reason);
});

export const validateResponse = (response) => {
  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.statusText || 'Request failed'
    );
  }
  return response;
};

export const retryRequest = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    // Only retry on network errors or 5xx server errors
    if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    
    throw error;
  }
};

export const errorMessages = {
  network: 'Unable to connect to the server. Please check your internet connection.',
  timeout: 'Request timed out. Please try again.',
  server: 'Server error. Our team has been notified.',
  unauthorized: 'Please log in to continue.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  default: 'An unexpected error occurred. Please try again.',
};
