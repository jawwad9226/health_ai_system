import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { DataProvider } from '../../contexts/DataContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Mock API response
export const mockApiResponse = (data) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

// Mock API error
export const mockApiError = (status = 500, message = 'Server Error') => {
  const error = new Error(message);
  error.status = status;
  return Promise.reject(error);
};

// Mock local storage
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    }),
  };
};

// Mock intersection observer
export const mockIntersectionObserver = () => {
  return jest.fn().mockImplementation(() => ({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  }));
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
