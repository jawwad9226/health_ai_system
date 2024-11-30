import { handleError, isNetworkError, formatErrorMessage } from '../../utils/errorHandler';
import { mockErrors } from './mockData';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('Error Handler Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isNetworkError', () => {
    it('identifies network errors correctly', () => {
      expect(isNetworkError(mockErrors.network)).toBe(true);
      expect(isNetworkError(mockErrors.auth)).toBe(false);
    });
  });

  describe('formatErrorMessage', () => {
    it('formats network error messages', () => {
      const message = formatErrorMessage(mockErrors.network);
      expect(message).toContain('Network error');
    });

    it('formats authentication error messages', () => {
      const message = formatErrorMessage(mockErrors.auth);
      expect(message).toContain('Authentication failed');
    });

    it('formats generic error messages', () => {
      const message = formatErrorMessage(new Error('Unknown error'));
      expect(message).toContain('Unknown error');
    });
  });

  describe('handleError', () => {
    it('handles network errors appropriately', () => {
      handleError(mockErrors.network);
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });

    it('handles authentication errors appropriately', () => {
      handleError(mockErrors.auth);
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      );
    });

    it('handles server errors appropriately', () => {
      handleError(mockErrors.server);
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Internal server error')
      );
    });

    it('handles unknown errors appropriately', () => {
      handleError(new Error('Unknown error'));
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      );
    });
  });
});
