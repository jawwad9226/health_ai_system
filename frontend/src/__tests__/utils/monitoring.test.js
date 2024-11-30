import { performance } from '../../utils/monitoring';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Mock performance API
    window.performance = {
      mark: jest.fn(),
      measure: jest.fn(),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
      getEntriesByType: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('markStart', () => {
    it('creates a start mark', () => {
      performance.markStart('test-operation');
      expect(window.performance.mark).toHaveBeenCalledWith('test-operation-start');
    });
  });

  describe('markEnd', () => {
    it('creates an end mark and measures duration', () => {
      performance.markEnd('test-operation');
      expect(window.performance.mark).toHaveBeenCalledWith('test-operation-end');
      expect(window.performance.measure).toHaveBeenCalledWith(
        'test-operation',
        'test-operation-start',
        'test-operation-end'
      );
    });
  });

  describe('getMetrics', () => {
    it('returns performance metrics when available', () => {
      const mockNavigationTiming = {
        requestStart: 100,
        responseStart: 200,
        domContentLoadedEventEnd: 500,
      };

      const mockPaintTiming = [
        { name: 'first-paint', startTime: 300 },
        { name: 'first-contentful-paint', startTime: 400 },
      ];

      window.performance.getEntriesByType
        .mockImplementation((type) => {
          if (type === 'navigation') return [mockNavigationTiming];
          if (type === 'paint') return mockPaintTiming;
          return [];
        });

      const metrics = performance.getMetrics();

      expect(metrics).toEqual({
        timeToFirstByte: 100,
        domContentLoaded: 400,
        firstPaint: 300,
        firstContentfulPaint: 400,
      });
    });

    it('returns null when performance API is not available', () => {
      window.performance = undefined;
      const metrics = performance.getMetrics();
      expect(metrics).toBeNull();
    });
  });

  describe('clearMarks', () => {
    it('clears performance marks and measures', () => {
      performance.clearMarks('test-operation');
      expect(window.performance.clearMarks).toHaveBeenCalledWith('test-operation-start');
      expect(window.performance.clearMarks).toHaveBeenCalledWith('test-operation-end');
      expect(window.performance.clearMeasures).toHaveBeenCalledWith('test-operation');
    });
  });
});
