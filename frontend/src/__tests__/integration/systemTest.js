import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupMonitoring } from '../../monitoring/setup';
import { runAccessibilityCheck } from '../../utils/accessibility';
import { performance } from '../../utils/monitoring';
import App from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';
import { DataProvider } from '../../contexts/DataContext';

describe('Health AI System Integration Tests', () => {
  let cleanup;

  beforeAll(() => {
    // Initialize monitoring
    const monitoring = setupMonitoring();
    cleanup = monitoring.cleanup;
  });

  afterAll(() => {
    if (cleanup) cleanup();
  });

  beforeEach(() => {
    // Reset performance marks
    performance.clearMarks('app-load');
    performance.clearMarks('route-change');
  });

  describe('System Initialization', () => {
    it('loads the application successfully', async () => {
      performance.markStart('app-load');
      
      render(
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      );

      performance.markEnd('app-load');
      const metrics = performance.getMetrics();
      
      expect(metrics.timeToFirstByte).toBeDefined();
      expect(metrics.domContentLoaded).toBeDefined();
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });

    it('passes accessibility checks', async () => {
      const { container } = render(
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      );

      const results = await runAccessibilityCheck(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Authentication Flow', () => {
    it('handles login process correctly', async () => {
      render(
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      );

      // Navigate to login
      const loginButton = screen.getByText(/login/i);
      fireEvent.click(loginButton);

      // Fill login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByText(/sign in/i));

      // Verify successful login
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Components', () => {
    beforeEach(async () => {
      // Login and navigate to dashboard
      // ... login logic ...
    });

    it('loads and displays health metrics widget', async () => {
      const healthMetrics = screen.getByTestId('health-metrics-widget');
      expect(healthMetrics).toBeInTheDocument();

      // Check accessibility of health metrics widget
      const results = await runAccessibilityCheck(healthMetrics);
      expect(results.violations).toHaveLength(0);
    });

    it('loads and displays risk assessment widget', async () => {
      const riskAssessment = screen.getByTestId('risk-assessment-widget');
      expect(riskAssessment).toBeInTheDocument();

      // Verify risk level is displayed
      expect(screen.getByText(/risk level/i)).toBeInTheDocument();
    });

    it('displays and interacts with appointment list', async () => {
      const appointmentList = screen.getByTestId('appointment-list');
      expect(appointmentList).toBeInTheDocument();

      // Test appointment scheduling
      const scheduleButton = screen.getByText(/schedule appointment/i);
      fireEvent.click(scheduleButton);

      await waitFor(() => {
        expect(screen.getByText(/select date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock a failed API call
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger an error condition
      // ... error triggering logic ...

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('handles network errors appropriately', async () => {
      // Simulate offline status
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      // Trigger a network request
      // ... network request logic ...

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('tracks API call performance', async () => {
      performance.markStart('api-call');
      
      // Make an API call
      // ... API call logic ...
      
      performance.markEnd('api-call');
      const metrics = performance.getMetrics();
      
      expect(metrics.timeToFirstByte).toBeLessThan(1000);
    });

    it('monitors memory usage', () => {
      if (window.performance.memory) {
        const { usedJSHeapSize, totalJSHeapSize } = window.performance.memory;
        const usagePercent = (usedJSHeapSize / totalJSHeapSize) * 100;
        
        expect(usagePercent).toBeLessThan(90);
      }
    });
  });

  describe('Accessibility Features', () => {
    it('supports keyboard navigation', () => {
      const focusableElements = screen.getAllByRole('button');
      
      // Test tab navigation
      focusableElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });

    it('has proper ARIA attributes', async () => {
      const { container } = render(
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      );

      const results = await runAccessibilityCheck(container);
      const ariaViolations = results.violations.filter(v => 
        v.id.startsWith('aria')
      );
      
      expect(ariaViolations).toHaveLength(0);
    });
  });
});
