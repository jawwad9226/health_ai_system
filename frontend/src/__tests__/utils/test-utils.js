import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { DataProvider } from '../../contexts/DataContext';

const customRender = (ui, { route = '/', ...renderOptions } = {}) => {
  // Push the route to history
  window.history.pushState({}, 'Test page', route);

  const AllProviders = ({ children }) => {
    return (
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  return {
    ...rtlRender(ui, { wrapper: AllProviders, ...renderOptions }),
  };
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
