import request from 'supertest';
import app from '../../index';
import AnnotationStorageService from '../../services/annotationStorage';
import { authMiddleware } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../services/annotationStorage');
jest.mock('../../middleware/auth');

describe('Annotation Routes', () => {
  const mockAnnotationService = AnnotationStorageService as jest.Mocked<typeof AnnotationStorageService>;
  const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

  // Setup before each test
  beforeEach(() => {
    // Reset mocks
    mockAnnotationService.prototype.saveAnnotations.mockReset();
    mockAnnotationService.prototype.getAnnotations.mockReset();
    mockAnnotationService.prototype.searchAnnotations.mockReset();
    mockAnnotationService.prototype.getAnnotationHistory.mockReset();
    mockAuthMiddleware.mockReset();

    // Default mock auth middleware
    mockAuthMiddleware.mockImplementation(() => (req, res, next) => {
      req.user = { 
        userId: 'test-user', 
        roles: ['user'] 
      };
      next();
    });
  });

  // Test annotation creation
  describe('POST /annotations', () => {
    const validAnnotationData = {
      imageId: 'test-image-123',
      annotations: [{ type: 'rectangle', coordinates: { x: 10, y: 20 } }]
    };

    test('should create annotation successfully', async () => {
      // Mock service method
      mockAnnotationService.prototype.saveAnnotations.mockResolvedValue('annotation-id');
      mockAnnotationService.prototype.getNextAnnotationVersion.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/annotations')
        .send(validAnnotationData)
        .expect(201);

      expect(response.body.id).toBe('annotation-id');
      expect(response.body.message).toBe('Annotation saved successfully');
      expect(mockAnnotationService.prototype.saveAnnotations).toHaveBeenCalledWith(
        validAnnotationData.imageId,
        expect.objectContaining({
          imageId: validAnnotationData.imageId,
          annotations: validAnnotationData.annotations
        }),
        'test-user'
      );
    });

    test('should reject invalid annotation data', async () => {
      const invalidAnnotationData = { 
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/annotations')
        .send(invalidAnnotationData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid annotation data');
    });
  });

  // Test annotation retrieval
  describe('GET /annotations/image/:imageId', () => {
    test('should retrieve annotations for an image', async () => {
      const mockAnnotations = [{ id: 'annotation-1' }];
      mockAnnotationService.prototype.getAnnotations.mockResolvedValue(mockAnnotations);

      const response = await request(app)
        .get('/api/annotations/image/test-image-123')
        .expect(200);

      expect(response.body.annotations).toEqual(mockAnnotations);
      expect(mockAnnotationService.prototype.getAnnotations).toHaveBeenCalledWith(
        'test-image-123',
        expect.objectContaining({
          version: undefined,
          includeDeleted: false,
          includeMetadata: true
        })
      );
    });

    test('should handle non-existent image annotations', async () => {
      mockAnnotationService.prototype.getAnnotations.mockResolvedValue(null);

      await request(app)
        .get('/api/annotations/image/non-existent')
        .expect(404);
    });
  });

  // Test annotation search
  describe('GET /annotations/search', () => {
    test('should search annotations with filters', async () => {
      const mockSearchResults = {
        annotations: [{ id: 'annotation-1' }],
        total: 1,
        totalPages: 1
      };
      mockAnnotationService.prototype.searchAnnotations.mockResolvedValue(mockSearchResults);

      const response = await request(app)
        .get('/api/annotations/search')
        .query({ 
          studyId: 'study-001', 
          patientId: 'patient-123' 
        })
        .expect(200);

      expect(response.body.annotations).toEqual(mockSearchResults.annotations);
      expect(response.body.total).toBe(1);
      expect(mockAnnotationService.prototype.searchAnnotations).toHaveBeenCalledWith(
        expect.objectContaining({
          studyId: 'study-001',
          patientId: 'patient-123'
        })
      );
    });
  });

  // Test annotation history
  describe('GET /annotations/history/:imageId', () => {
    test('should retrieve annotation history', async () => {
      const mockHistory = [{ version: 1 }, { version: 2 }];
      mockAnnotationService.prototype.getAnnotationHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/annotations/history/test-image-123')
        .expect(200);

      expect(response.body.history).toEqual(mockHistory);
      expect(response.body.total).toBe(2);
      expect(mockAnnotationService.prototype.getAnnotationHistory).toHaveBeenCalledWith(
        'test-image-123',
        expect.objectContaining({
          limit: 10,
          page: 1,
          includeDeleted: false
        })
      );
    });
  });

  // Test annotation deletion
  describe('DELETE /annotations/:annotationId', () => {
    test('should soft delete an annotation', async () => {
      // Ensure admin role
      mockAuthMiddleware.mockImplementation(() => (req, res, next) => {
        req.user = { 
          userId: 'admin-user', 
          roles: ['admin'] 
        };
        next();
      });

      mockAnnotationService.prototype.softDeleteAnnotation.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/annotations/annotation-to-delete')
        .expect(200);

      expect(response.body.message).toBe('Annotation soft deleted successfully');
      expect(mockAnnotationService.prototype.softDeleteAnnotation).toHaveBeenCalledWith(
        'annotation-to-delete',
        'admin-user'
      );
    });

    test('should reject deletion for non-admin users', async () => {
      // Reset to non-admin user
      mockAuthMiddleware.mockImplementation(() => (req, res, next) => {
        req.user = { 
          userId: 'regular-user', 
          roles: ['user'] 
        };
        next();
      });

      await request(app)
        .delete('/api/annotations/annotation-to-delete')
        .expect(403);
    });
  });

  // Authorization tests
  describe('Authorization Checks', () => {
    test('should reject unauthenticated requests', async () => {
      mockAuthMiddleware.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      await request(app)
        .post('/api/annotations')
        .send({})
        .expect(401);
    });
  });
});
