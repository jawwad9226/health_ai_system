import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';

export const initializeMonitoring = () => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: [
            'localhost',
            process.env.REACT_APP_API_BASE_URL,
          ],
        }),
        new Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
  }
};

export const captureError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    console.log('Context:', context);
    return;
  }

  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
};

export const startPerformanceMonitoring = (routeName) => {
  const transaction = Sentry.startTransaction({
    name: routeName,
    op: 'navigation',
  });

  // Record key metrics
  if ('performance' in window) {
    window.performance.mark(`${routeName}-start`);
  }

  return {
    finish: () => {
      transaction.finish();
      if ('performance' in window) {
        window.performance.mark(`${routeName}-end`);
        window.performance.measure(
          `${routeName}-duration`,
          `${routeName}-start`,
          `${routeName}-end`
        );
      }
    },
  };
};

export const measureApiCall = async (apiCall, name) => {
  const span = Sentry.startTransaction({
    name: `API Call: ${name}`,
    op: 'http.client',
  });

  try {
    const result = await apiCall();
    span.setStatus('ok');
    return result;
  } catch (error) {
    span.setStatus('error');
    throw error;
  } finally {
    span.finish();
  }
};

export const trackUserAction = (action, data = {}) => {
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: action,
    data,
    level: 'info',
  });
};

// Performance monitoring utilities
export const performance = {
  markStart: (name) => {
    if ('performance' in window) {
      window.performance.mark(`${name}-start`);
    }
  },

  markEnd: (name) => {
    if ('performance' in window) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(
        name,
        `${name}-start`,
        `${name}-end`
      );
    }
  },

  getMetrics: () => {
    if ('performance' in window) {
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      const paintTiming = performance.getEntriesByType('paint');

      return {
        timeToFirstByte: navigationTiming?.responseStart - navigationTiming?.requestStart,
        domContentLoaded: navigationTiming?.domContentLoadedEventEnd - navigationTiming?.requestStart,
        firstPaint: paintTiming.find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintTiming.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      };
    }
    return null;
  },

  clearMarks: (name) => {
    if ('performance' in window) {
      window.performance.clearMarks(`${name}-start`);
      window.performance.clearMarks(`${name}-end`);
      window.performance.clearMeasures(name);
    }
  },
};
