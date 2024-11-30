import { MongoClient, Db, Collection } from 'mongodb';
import Redis from 'ioredis';
import { AnnotationData } from '../validators/annotationValidator';
import { extendedLogger } from '../utils/logger';
import { AppConfig } from '../utils/config';

interface StoredAnnotation extends AnnotationData {
  _id?: string;
  userId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

interface SearchOptions {
  studyId?: string;
  patientId?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

class AnnotationStorageService {
  private db: Db;
  private redis: Redis;
  private annotationCollection: Collection<StoredAnnotation>;

  constructor(mongoClient: MongoClient, redisClient: Redis, config: AppConfig) {
    this.db = mongoClient.db(config.database.dbName);
    this.redis = redisClient;
    this.annotationCollection = this.db.collection('annotations');
  }

  // Save new annotation
  async saveAnnotations(
    imageId: string, 
    annotationData: AnnotationData, 
    userId: string
  ): Promise<string> {
    try {
      // Get next version number
      const version = await this.getNextAnnotationVersion(imageId);

      const storedAnnotation: StoredAnnotation = {
        ...annotationData,
        userId,
        version,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      };

      const result = await this.annotationCollection.insertOne(storedAnnotation);

      // Cache annotation in Redis
      await this.cacheAnnotation(result.insertedId.toString(), storedAnnotation);

      extendedLogger.info('Annotation saved', { 
        imageId, 
        annotationId: result.insertedId,
        version 
      });

      return result.insertedId.toString();
    } catch (error) {
      extendedLogger.error('Failed to save annotation', { 
        error, 
        imageId, 
        userId 
      });
      throw new Error('Failed to save annotation');
    }
  }

  // Get next version number for an image
  async getNextAnnotationVersion(imageId: string): Promise<number> {
    const versionKey = `annotation:version:${imageId}`;
    const currentVersion = await this.redis.incr(versionKey);
    return currentVersion;
  }

  // Cache annotation in Redis
  private async cacheAnnotation(
    annotationId: string, 
    annotation: StoredAnnotation
  ): Promise<void> {
    const cacheKey = `annotation:${annotationId}`;
    await this.redis.set(
      cacheKey, 
      JSON.stringify(annotation), 
      'EX', 
      3600 // 1 hour expiration
    );
  }

  // Get annotations for an image
  async getAnnotations(
    imageId: string, 
    options: {
      version?: number;
      includeDeleted?: boolean;
      includeMetadata?: boolean;
    } = {}
  ): Promise<StoredAnnotation[] | null> {
    try {
      const query: any = { imageId };

      // Handle version filtering
      if (options.version !== undefined) {
        query.version = options.version;
      }

      // Handle deleted annotations
      if (!options.includeDeleted) {
        query.isDeleted = false;
      }

      const annotations = await this.annotationCollection
        .find(query)
        .toArray();

      return annotations.length > 0 ? annotations : null;
    } catch (error) {
      extendedLogger.error('Failed to retrieve annotations', { 
        error, 
        imageId 
      });
      return null;
    }
  }

  // Search annotations with flexible filtering
  async searchAnnotations(
    options: SearchOptions
  ): Promise<{
    annotations: StoredAnnotation[];
    total: number;
    totalPages: number;
  }> {
    try {
      const query: any = {};
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      // Add filters
      if (options.studyId) {
        query['metadata.studyId'] = options.studyId;
      }
      if (options.patientId) {
        query['metadata.patientId'] = options.patientId;
      }
      if (!options.includeDeleted) {
        query.isDeleted = false;
      }

      const [annotations, total] = await Promise.all([
        this.annotationCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.annotationCollection.countDocuments(query)
      ]);

      return {
        annotations,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      extendedLogger.error('Failed to search annotations', { error, options });
      throw new Error('Failed to search annotations');
    }
  }

  // Get annotation history for an image
  async getAnnotationHistory(
    imageId: string, 
    options: {
      page?: number;
      limit?: number;
      includeDeleted?: boolean;
    } = {}
  ): Promise<StoredAnnotation[]> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = { imageId };
      if (!options.includeDeleted) {
        query.isDeleted = false;
      }

      return await this.annotationCollection
        .find(query)
        .sort({ version: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch (error) {
      extendedLogger.error('Failed to retrieve annotation history', { 
        error, 
        imageId 
      });
      throw new Error('Failed to retrieve annotation history');
    }
  }

  // Soft delete an annotation
  async softDeleteAnnotation(
    annotationId: string, 
    userId: string
  ): Promise<boolean> {
    try {
      const result = await this.annotationCollection.updateOne(
        { _id: annotationId },
        { 
          $set: { 
            isDeleted: true, 
            deletedBy: userId,
            deletedAt: new Date() 
          } 
        }
      );

      if (result.modifiedCount === 0) {
        extendedLogger.warn('No annotation found to delete', { 
          annotationId, 
          userId 
        });
        return false;
      }

      // Invalidate cache
      await this.redis.del(`annotation:${annotationId}`);

      extendedLogger.info('Annotation soft deleted', { 
        annotationId, 
        userId 
      });

      return true;
    } catch (error) {
      extendedLogger.error('Failed to soft delete annotation', { 
        error, 
        annotationId, 
        userId 
      });
      throw new Error('Failed to soft delete annotation');
    }
  }

  // Delete annotations for an image
  async deleteAnnotations(imageId: string): Promise<void> {
    try {
      await this.annotationCollection.deleteMany({ imageId });
      await this.redis.del(`annotations:${imageId}`);
      extendedLogger.info('Annotations deleted', { imageId });
    } catch (error) {
      extendedLogger.error('Failed to delete annotations', { error, imageId });
      throw new Error('Failed to delete annotations');
    }
  }
}

export default AnnotationStorageService;
