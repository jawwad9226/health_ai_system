import { Router } from 'express';
import { auth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import ImageStorageService from '../services/imageStorage';
import { logger } from '../utils/logger';

export function setupImageRoutes(router: Router, imageService: ImageStorageService): void {
  // Get presigned URL for image upload
  router.post('/presigned-url', auth(['user', 'admin']), async (req, res, next) => {
    try {
      const { fileName, contentType } = req.body;
      if (!fileName || !contentType) {
        throw new AppError(400, 'fileName and contentType are required');
      }

      const presignedUrl = await imageService.getImageUrl(fileName, contentType);
      res.json({ presignedUrl });
    } catch (error) {
      next(error);
    }
  });

  // Upload image metadata after successful S3 upload
  router.post('/metadata', auth(['user', 'admin']), async (req, res, next) => {
    try {
      const { fileName, metadata } = req.body;
      if (!fileName || !metadata) {
        throw new AppError(400, 'fileName and metadata are required');
      }

      const result = await imageService.saveMetadata(fileName, {
        ...metadata,
        uploadedBy: req.user?.userId,
        uploadedAt: new Date(),
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Get image details
  router.get('/:imageId', auth(['user', 'admin']), async (req, res, next) => {
    try {
      const { imageId } = req.params;
      const image = await imageService.getImage(imageId);
      if (!image) {
        throw new AppError(404, 'Image not found');
      }
      res.json(image);
    } catch (error) {
      next(error);
    }
  });

  // Delete image
  router.delete('/:imageId', auth(['admin']), async (req, res, next) => {
    try {
      const { imageId } = req.params;
      await imageService.deleteImage(imageId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Search images
  router.get('/', auth(['user', 'admin']), async (req, res, next) => {
    try {
      const { query, page = 1, limit = 20 } = req.query;
      const images = await imageService.searchImages({
        query: query as string,
        page: Number(page),
        limit: Number(limit),
        userId: req.user?.userId,
      });
      res.json(images);
    } catch (error) {
      next(error);
    }
  });

  // Generate thumbnail
  router.post('/:imageId/thumbnail', auth(['user', 'admin']), async (req, res, next) => {
    try {
      const { imageId } = req.params;
      const { width = 200, height = 200 } = req.body;
      const thumbnail = await imageService.generateThumbnail(imageId, width, height);
      res.json(thumbnail);
    } catch (error) {
      next(error);
    }
  });
}
