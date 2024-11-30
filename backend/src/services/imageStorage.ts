import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import RedisService from '../config/redis';
import { logger } from '../utils/logger';

class ImageStorageService {
  private s3: S3;
  private redis: RedisService;
  private readonly bucket: string;
  private readonly imagePrefix = 'image:';
  private readonly metadataPrefix = 'metadata:';
  private readonly cacheTTL = 3600; // 1 hour

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.bucket = process.env.AWS_BUCKET_NAME || 'health-ai-images';
    this.redis = RedisService.getInstance();
  }

  private getImageKey(imageId: string): string {
    return `${this.imagePrefix}${imageId}`;
  }

  private getMetadataKey(imageId: string): string {
    return `${this.metadataPrefix}${imageId}`;
  }

  public async getImageUrl(fileName: string, contentType: string): Promise<string> {
    try {
      const key = `${uuidv4()}-${fileName}`;
      const params = {
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Expires: 300, // URL expires in 5 minutes
      };

      const url = await this.s3.getSignedUrlPromise('putObject', params);
      logger.debug(`Generated presigned URL for ${fileName}`);
      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  public async saveMetadata(fileName: string, metadata: any): Promise<string> {
    try {
      const imageId = uuidv4();
      const metadataKey = this.getMetadataKey(imageId);
      
      const metadataWithTimestamp = {
        ...metadata,
        fileName,
        imageId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Redis cache
      await this.redis.set(metadataKey, metadataWithTimestamp, this.cacheTTL);
      
      // Save to database (implement your database logic here)
      // await this.db.saveMetadata(metadataWithTimestamp);

      logger.debug(`Saved metadata for image ${imageId}`);
      return imageId;
    } catch (error) {
      logger.error('Error saving metadata:', error);
      throw error;
    }
  }

  public async getImage(imageId: string): Promise<any> {
    try {
      // Check cache first
      const cachedImage = await this.redis.get(this.getImageKey(imageId));
      if (cachedImage) {
        logger.debug(`Cache hit for image ${imageId}`);
        return cachedImage;
      }

      // Get from S3
      const params = {
        Bucket: this.bucket,
        Key: imageId,
      };

      const image = await this.s3.getObject(params).promise();
      
      // Cache the image
      await this.redis.set(this.getImageKey(imageId), image, this.cacheTTL);
      
      logger.debug(`Retrieved image ${imageId} from S3`);
      return image;
    } catch (error) {
      logger.error(`Error retrieving image ${imageId}:`, error);
      throw error;
    }
  }

  public async deleteImage(imageId: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: imageId,
      };

      await this.s3.deleteObject(params).promise();
      
      // Clear from cache
      await this.redis.del(this.getImageKey(imageId));
      await this.redis.del(this.getMetadataKey(imageId));
      
      logger.debug(`Deleted image ${imageId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting image ${imageId}:`, error);
      throw error;
    }
  }

  public async searchImages(params: any): Promise<any[]> {
    try {
      const cacheKey = `search:${JSON.stringify(params)}`;
      
      // Check cache first
      const cachedResults = await this.redis.get(cacheKey);
      if (cachedResults) {
        logger.debug('Cache hit for image search');
        return cachedResults;
      }

      // Implement your search logic here
      // const results = await this.db.searchImages(params);
      const results: any[] = [];

      // Cache the results
      await this.redis.set(cacheKey, results, 300); // Cache for 5 minutes
      
      return results;
    } catch (error) {
      logger.error('Error searching images:', error);
      throw error;
    }
  }

  public async generateThumbnail(imageId: string, width: number, height: number): Promise<any> {
    try {
      const cacheKey = `thumbnail:${imageId}:${width}x${height}`;
      
      // Check cache first
      const cachedThumbnail = await this.redis.get(cacheKey);
      if (cachedThumbnail) {
        logger.debug(`Cache hit for thumbnail ${imageId}`);
        return cachedThumbnail;
      }

      // Get original image
      const image = await this.getImage(imageId);
      
      // Implement thumbnail generation logic here
      // const thumbnail = await sharp(image.Body)
      //   .resize(width, height)
      //   .toBuffer();

      // For now, return a placeholder
      const thumbnail = { data: 'thumbnail_placeholder' };

      // Cache the thumbnail
      await this.redis.set(cacheKey, thumbnail, this.cacheTTL);
      
      return thumbnail;
    } catch (error) {
      logger.error(`Error generating thumbnail for ${imageId}:`, error);
      throw error;
    }
  }
}

export default ImageStorageService;
