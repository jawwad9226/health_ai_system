import { initializeMonitoring, performance } from '../utils/monitoring';
import { runAccessibilityCheck } from '../utils/accessibility';

// Initialize monitoring on app start
export const setupMonitoring = () => {
  // Initialize Sentry
  initializeMonitoring();

  // Start performance monitoring
  performance.markStart('app-load');

  // Monitor route changes
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    const result = originalPushState.apply(this, args);
    performance.markStart('route-change');
    
    // Measure route change performance
    setTimeout(() => {
      performance.markEnd('route-change');
      const metrics = performance.getMetrics();
      if (metrics) {
        console.debug('Route Change Metrics:', metrics);
      }
    }, 1000);
    
    return result;
  };

  // Monitor network requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const startTime = performance.now();
    try {
      const response = await originalFetch.apply(this, args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.debug(`API Call to ${args[0]} took ${duration}ms`);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Run periodic accessibility checks in development
  if (process.env.NODE_ENV === 'development') {
    const runPeriodicA11yChecks = async () => {
      try {
        const results = await runAccessibilityCheck();
        if (results.violations.length > 0) {
          console.warn('Accessibility violations found:', results.violations);
        }
      } catch (error) {
        console.error('Failed to run accessibility check:', error);
      }
    };

    // Run checks every 5 minutes in development
    setInterval(runPeriodicA11yChecks, 5 * 60 * 1000);
  }

  // Monitor JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('JavaScript Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  // Monitor unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });

  // Monitor resource loading
  window.addEventListener('load', () => {
    performance.markEnd('app-load');
    const resources = window.performance.getEntriesByType('resource');
    const slowResources = resources.filter(r => r.duration > 1000);
    
    if (slowResources.length > 0) {
      console.warn('Slow resources detected:', 
        slowResources.map(r => ({
          name: r.name,
          duration: r.duration,
          type: r.initiatorType,
        }))
      );
    }
  });

  // Monitor memory usage
  if (window.performance.memory) {
    setInterval(() => {
      const { usedJSHeapSize, totalJSHeapSize } = window.performance.memory;
      const usagePercent = (usedJSHeapSize / totalJSHeapSize) * 100;
      
      if (usagePercent > 90) {
        console.warn('High memory usage detected:', {
          used: usedJSHeapSize,
          total: totalJSHeapSize,
          percentage: usagePercent,
        });
      }
    }, 30000);
  }

  return {
    cleanup: () => {
      // Restore original functions
      history.pushState = originalPushState;
      window.fetch = originalFetch;
    },
  };
};
