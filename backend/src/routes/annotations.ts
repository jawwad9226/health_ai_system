import express, { Request, Response, NextFunction } from 'express';
import { validateAnnotationSchema } from '../validators/annotationValidator';
import AnnotationStorageService from '../services/annotationStorage';
import { authMiddleware } from '../middleware/auth';
import { extendedLogger } from '../utils/logger';

class AnnotationRoutes {
  router: express.Router;
  annotationService: AnnotationStorageService;

  constructor(annotationService: AnnotationStorageService) {
    this.router = express.Router();
    this.annotationService = annotationService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create new annotation
    this.router.post(
      '/', 
      authMiddleware(), 
      this.createAnnotation.bind(this)
    );

    // Get annotations for an image
    this.router.get(
      '/image/:imageId', 
      authMiddleware(), 
      this.getImageAnnotations.bind(this)
    );

    // Search annotations
    this.router.get(
      '/search', 
      authMiddleware(), 
      this.searchAnnotations.bind(this)
    );

    // Get annotation history
    this.router.get(
      '/history/:imageId', 
      authMiddleware(), 
      this.getAnnotationHistory.bind(this)
    );

    // Soft delete annotation (admin only)
    this.router.delete(
      '/:annotationId', 
      authMiddleware(['admin']), 
      this.softDeleteAnnotation.bind(this)
    );
  }

  // Create new annotation
  private async createAnnotation(
    req: Request, 
    res: Response, 
    next: NextFunction
  ) {
    try {
      const { imageId } = req.body;
      const userId = req.user?.userId;

      // Validate annotation data
      const validationResult = validateAnnotationSchema(req.body);
      if (!validationResult.valid) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid annotation data',
          errors: validationResult.errors
        });
      }

      // Save annotation
      const annotationId = await this.annotationService.saveAnnotations(
        imageId, 
        req.body, 
        userId
      );

      res.status(201).json({
        status: 'success',
        message: 'Annotation saved successfully',
        id: annotationId
      });
    } catch (error) {
      extendedLogger.error('Annotation creation error', { error, body: req.body });
      next(error);
    }
  }

  // Get annotations for a specific image
  private async getImageAnnotations(
    req: Request, 
    res: Response, 
    next: NextFunction
  ) {
    try {
      const { imageId } = req.params;
      const { 
        version, 
        includeDeleted = false, 
        includeMetadata = true 
      } = req.query;

      const annotations = await this.annotationService.getAnnotations(
        imageId, 
        { 
          version: version ? Number(version) : undefined,
          includeDeleted: includeDeleted === 'true',
          includeMetadata: includeMetadata !== 'false'
        }
      );

      if (!annotations) {
        return res.status(404).json({
          status: 'error',
          message: 'No annotations found for this image'
        });
      }

      res.status(200).json({
        status: 'success',
        annotations
      });
    } catch (error) {
      extendedLogger.error('Get image annotations error', { error, imageId: req.params.imageId });
      next(error);
    }
  }

  // Search annotations with flexible filtering
  private async searchAnnotations(
    req: Request, 
    res: Response, 
    next: NextFunction
  ) {
    try {
      const { 
        studyId, 
        patientId, 
        page = 1, 
        limit = 10,
        includeDeleted = false
      } = req.query;

      const searchResults = await this.annotationService.searchAnnotations({
        studyId: studyId as string,
        patientId: patientId as string,
        page: Number(page),
        limit: Number(limit),
        includeDeleted: includeDeleted === 'true'
      });

      res.status(200).json({
        status: 'success',
        ...searchResults
      });
    } catch (error) {
      extendedLogger.error('Search annotations error', { error, query: req.query });
      next(error);
    }
  }

  // Get annotation history for an image
  private async getAnnotationHistory(
    req: Request, 
    res: Response, 
    next: NextFunction
  ) {
    try {
      const { imageId } = req.params;
      const { 
        page = 1, 
        limit = 10,
        includeDeleted = false 
      } = req.query;

      const history = await this.annotationService.getAnnotationHistory(
        imageId, 
        {
          page: Number(page),
          limit: Number(limit),
          includeDeleted: includeDeleted === 'true'
        }
      );

      res.status(200).json({
        status: 'success',
        history,
        total: history.length
      });
    } catch (error) {
      extendedLogger.error('Get annotation history error', { error, imageId: req.params.imageId });
      next(error);
    }
  }

  // Soft delete an annotation (admin only)
  private async softDeleteAnnotation(
    req: Request, 
    res: Response, 
    next: NextFunction
  ) {
    try {
      const { annotationId } = req.params;
      const userId = req.user?.userId;

      const deleted = await this.annotationService.softDeleteAnnotation(
        annotationId, 
        userId
      );

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Annotation not found or already deleted'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Annotation soft deleted successfully'
      });
    } catch (error) {
      extendedLogger.error('Soft delete annotation error', { error, annotationId: req.params.annotationId });
      next(error);
    }
  }

  // Getter for router
  getRouter(): express.Router {
    return this.router;
  }
}

export default AnnotationRoutes;
