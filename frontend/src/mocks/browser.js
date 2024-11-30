import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// Conditionally start the worker
if (process.env.REACT_APP_API_MOCKING === 'enabled') {
  worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  });
}
