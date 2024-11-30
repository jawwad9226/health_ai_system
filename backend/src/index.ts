import express, { Application, Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import helmet from 'helmet';
import compression from 'compression';

// Routes
import AnnotationRoutes from './routes/annotations';
import { setupImageRoutes } from './routes/images';
import { setupUserRoutes } from './routes/users';

// Services
import AnnotationStorageService from './services/annotationStorage';
import ImageStorageService from './services/imageStorage';
import { UserManagementService, UserRole } from './services/userManagement';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { createRequestLogger } from './middleware/requestLogger';
import { createPerformanceMonitor } from './middleware/performanceMonitor';
import { rateLimiter } from './middleware/rateLimiter';
import { checkSystemLoad } from './utils/systemMonitor';
import { extendedLogger } from './utils/logger';
import authenticateToken from './middleware/authenticateToken'; // Import authenticateToken middleware

// Utilities
import config from './utils/config';

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: UserRole;
    permissions?: string[];
  };
}

type HealthResponse = {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: {
    system: boolean;
    mongodb: boolean;
    redis: boolean;
  };
};

interface AppConfig {
  port: number;
  environment: string;
  database: {
    mongodb: string;
    redis: {
      host: string;
      port: number;
      uri: string;
    };
    dbName: string;
  };
  security: {
    secretKey: string;
    jwtSecretKey: string;
    jwtSecret: string;
  };
  cors: {
    origins: string[];
    origin: string;
  };
  api: {
    title: string;
    version: string;
  };
  mlModels: {
    path: string;
  };
  features: {
    enablePerformanceLogging: boolean;
    enableRateLimiting: boolean;
  };
  logging: {
    level: string;
  };
  frontend: {
    url: string;
  };
}

// Correctly initialize AppConfig
const dbConfig: AppConfig = {
  port: 3000,
  environment: 'development',
  database: {
    mongodb: 'mongodb://localhost:27017',
    redis: {
      host: 'localhost',
      port: 6379,
      uri: 'redis://localhost:6379'
    },
    dbName: 'myDatabase'
  },
  security: {
    secretKey: 'mySecretKey',
    jwtSecretKey: 'myJwtSecret',
    jwtSecret: 'myJwtSecret'
  },
  cors: {
    origins: ['http://localhost:3000'],
    origin: 'http://localhost:3000'
  },
  api: {
    title: 'My API',
    version: '1.0.0'
  },
  mlModels: {
    path: 'modelsPath'
  },
  features: {
    enablePerformanceLogging: true,
    enableRateLimiting: true
  },
  logging: {
    level: 'info'
  },
  frontend: {
    url: 'http://localhost:3000'
  }
};

class Server {
  private app: Application;
  private config: AppConfig;
  private mongoClient: MongoClient;
  private redisClient: Redis;

  constructor(config: AppConfig) {
    this.app = express();
    this.config = config;
    this.mongoClient = new MongoClient(config.database.mongodb);
    this.redisClient = new Redis(config.database.redis.uri);
  }

  private async setupMiddleware(): Promise<void> {
    // Basic middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: this.config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    const requestLogger = createRequestLogger();
    const performanceMonitor = createPerformanceMonitor();

    this.app.use(requestLogger);
    this.app.use(performanceMonitor);

    // Performance and logging middleware
    if (dbConfig.api.version === '1.0.0') {
      // logSystemPerformance();
    }

    // Rate limiting middleware
    if (dbConfig.environment === 'development') {
      this.app.use(rateLimiter());
    }
  }

  private async connectDatabases(): Promise<void> {
    try {
      await this.mongoClient.connect();
      extendedLogger.info('Connected to MongoDB');

      const redisStatus = await this.redisClient.ping();
      if (redisStatus === 'PONG') {
        extendedLogger.info('Connected to Redis');
      } else {
        throw new Error('Redis connection test failed');
      }
    } catch (error) {
      extendedLogger.error('Database connection error:', error);
      throw error;
    }
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    process.on('uncaughtException', (error: Error) => {
      extendedLogger.error('Uncaught Exception:', error);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      extendedLogger.error('Unhandled Rejection:', reason);
      this.shutdown(1);
    });
  }

  private async shutdown(code: number): Promise<void> {
    extendedLogger.info('Shutting down server...');

    try {
      await this.mongoClient.close();
      extendedLogger.info('MongoDB connection closed');

      await this.redisClient.quit();
      extendedLogger.info('Redis connection closed');

      process.exit(code);
    } catch (error) {
      extendedLogger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Connect to databases
      await this.connectDatabases();

      // Setup middleware
      await this.setupMiddleware();

      // Initialize services
      const annotationService = new AnnotationStorageService(this.mongoClient, this.redisClient, dbConfig);
      const imageService = new ImageStorageService();
      const userService = new UserManagementService(this.mongoClient, this.redisClient, dbConfig);

      // Initialize routes
      const annotationRoutes = new AnnotationRoutes(annotationService);
      const imageRouter = Router();
      const userRouter = Router();

      // Setup route handlers
      setupImageRoutes(imageRouter, imageService);
      setupUserRoutes(userRouter, userService);

      // Mount routes
      this.app.use('/api/annotations', annotationRoutes.router);
      this.app.use('/api/images', imageRouter);
      this.app.use('/api/users', userRouter);

      // Health check endpoint (unprotected)
      this.app.get<{}, HealthResponse>('/health', async (req: Request, res: Response<HealthResponse>, next: NextFunction) => {
        try {
          const systemHealthy = await checkSystemLoad();
          let mongoConnected = false;
          
          try {
            await this.mongoClient.db(dbConfig.database.dbName).command({ ping: 1 });
            mongoConnected = true;
          } catch (error) {
            mongoConnected = false;
          }
          
          const redisConnected = this.redisClient.status === 'ready';
          
          const status = mongoConnected && redisConnected && systemHealthy ? 'healthy' : 'degraded';
          const statusCode = status === 'healthy' ? 200 : 503;
          
          res.status(statusCode).json({
            status,
            timestamp: new Date().toISOString(),
            services: {
              system: systemHealthy,
              mongodb: mongoConnected,
              redis: redisConnected
            }
          });
        } catch (error) {
          next(error);
        }
      });

      // Protected routes
      this.app.get<{}, any>('/protected', 
        authenticateToken,
        (req: Request, res: Response, next: NextFunction) => {
          try {
            res.json({ message: 'Protected route accessed successfully' });
          } catch (error) {
            next(error);
          }
        }
      );

      // Setup error handling last
      this.setupErrorHandling();

      // Start server
      this.app.listen(dbConfig.port, () => {
        extendedLogger.info(`Server running on http://localhost:${dbConfig.port}`);
      });
    } catch (error) {
      extendedLogger.error('Error starting server:', error);
      throw error;
    }
  }
}

const server = new Server(dbConfig);
server.start();
