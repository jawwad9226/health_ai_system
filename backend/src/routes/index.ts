import { Application } from 'express';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import { AppConfig } from '../utils/config';
import { setupAnnotationRoutes } from './annotations';
import { setupUserRoutes } from './users';
import { setupImageRoutes } from './images';

export function setupRoutes(
  app: Application,
  mongoClient: MongoClient,
  redisClient: Redis,
  config: AppConfig
): void {
  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  // API version route
  app.get('/version', (req, res) => {
    res.status(200).json({
      version: config.api.version,
      environment: config.environment
    });
  });

  // Setup feature routes
  setupAnnotationRoutes(app, mongoClient, redisClient, config);
  setupUserRoutes(app, mongoClient, redisClient, config);
  setupImageRoutes(app, mongoClient, redisClient, config);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  });
}
