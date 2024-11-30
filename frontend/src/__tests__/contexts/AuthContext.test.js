import React from 'react';
import { render, screen, waitFor } from '../utils/test-utils';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { mockUser, mockApiResponses } from '../utils/mockData';
import * as healthApi from '../../api/healthApi';

// Mock the healthApi
jest.mock('../../api/healthApi');

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn(key => localStorageMock.store[key]),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn(key => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, error, loading } = useAuth();

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <>
          <div data-testid="user-email">{user.email}</div>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <div>
          <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
            Login
          </button>
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('provides initial authentication state', async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    healthApi.login.mockResolvedValueOnce({ data: mockApiResponses.login });
    healthApi.fetchUserProfile.mockResolvedValueOnce({ data: mockUser });

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const loginButton = screen.getByRole('button', { name: /login/i });
    await loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockApiResponses.login.token);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockApiResponses.login.refresh_token);
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    healthApi.login.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const loginButton = screen.getByRole('button', { name: /login/i });
    await loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });
  });

  it('handles logout', async () => {
    // Setup initial logged-in state
    localStorageMock.setItem('token', mockApiResponses.login.token);
    healthApi.fetchUserProfile.mockResolvedValueOnce({ data: mockUser });
    healthApi.logout.mockResolvedValueOnce({});

    render(<TestComponent />);

    // Wait for initial profile fetch to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Verify user is logged in
    expect(screen.getByTestId('user-email')).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await logoutButton.click();

    // Verify user is logged out
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('initializes with stored token', async () => {
    localStorageMock.setItem('token', mockApiResponses.login.token);
    healthApi.fetchUserProfile.mockResolvedValueOnce({ data: mockUser });

    render(<TestComponent />);

    // Wait for initial profile fetch to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Verify user is logged in
    expect(screen.getByTestId('user-email')).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
  });

  it('handles token refresh error', async () => {
    localStorageMock.setItem('token', 'expired-token');
    healthApi.fetchUserProfile.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Token expired' } },
    });

    render(<TestComponent />);

    // Wait for initial profile fetch to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Verify user is logged out and tokens are removed
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });
});
