import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { extendedLogger } from './logger';

// Define the shape of the configuration
export interface AppConfig {
  port: number;
  environment: string;
  database: {
    sqlite?: string;
    mongodb: string;
    redis: {
      host: string;
      port: number;
      password?: string;
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

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private configPath: string;

  private constructor() {
    // Load environment variables
    dotenv.config();

    // Define config path based on environment
    this.configPath = path.resolve(
      process.cwd(), 
      'config', 
      `${process.env.NODE_ENV || 'development'}.json`
    );

    // Initialize configuration
    this.config = this.loadConfig();
  }

  // Singleton pattern
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Load configuration from file and environment
  private loadConfig(): AppConfig {
    try {
      // Default configuration
      const defaultConfig: AppConfig = {
        port: parseInt(process.env.PORT || '3001', 10),
        environment: process.env.NODE_ENV || 'development',
        database: {
          sqlite: process.env.DATABASE_URL || 'sqlite:///health_ai.db',
          mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/health_ai_system',
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            uri: process.env.REDIS_URI || 'redis://localhost:6379'
          },
          dbName: process.env.DB_NAME || 'health_ai_system'
        },
        security: {
          secretKey: process.env.SECRET_KEY || 'default_secret_key',
          jwtSecretKey: process.env.JWT_SECRET_KEY || 'default_jwt_secret_key',
          jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret'
        },
        cors: {
          origins: JSON.parse(process.env.CORS_ORIGINS || '["http://localhost:3000"]'),
          origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
        },
        api: {
          title: process.env.API_TITLE || 'Health AI System API',
          version: process.env.API_VERSION || '1.0.0'
        },
        mlModels: {
          path: process.env.MODEL_PATH || 'ml_models'
        },
        features: {
          enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING === 'true',
          enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false'
        },
        logging: {
          level: process.env.LOG_LEVEL || 'info'
        },
        frontend: {
          url: process.env.FRONTEND_URL || 'http://localhost:3000'
        }
      };

      // If config file exists, merge with default config
      if (fs.existsSync(this.configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return { ...defaultConfig, ...fileConfig };
      }

      return defaultConfig;
    } catch (error) {
      extendedLogger.error('Configuration Loading Error', { 
        error, 
        configPath: this.configPath 
      });
      
      // Fallback to minimal configuration
      return {
        port: 3001,
        environment: 'development',
        database: {
          mongodb: 'mongodb://localhost:27017/health_ai_system',
          redis: {
            host: 'localhost',
            port: 6379,
            uri: 'redis://localhost:6379'
          },
          dbName: 'health_ai_system'
        },
        security: {
          secretKey: 'fallback_secret_key',
          jwtSecretKey: 'fallback_jwt_secret_key',
          jwtSecret: 'fallback_jwt_secret'
        },
        cors: {
          origins: ['http://localhost:3000'],
          origin: 'http://localhost:3000'
        },
        api: {
          title: 'Health AI System API',
          version: '1.0.0'
        },
        mlModels: {
          path: 'ml_models'
        },
        features: {
          enablePerformanceLogging: false,
          enableRateLimiting: true
        },
        logging: {
          level: 'error'
        },
        frontend: {
          url: 'http://localhost:3000'
        }
      };
    }
  }

  // Get a specific configuration value
  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  // Reload configuration
  public reload(): void {
    try {
      this.config = this.loadConfig();
      extendedLogger.info('Configuration Reloaded', { 
        environment: this.config.environment 
      });
    } catch (error) {
      extendedLogger.error('Configuration Reload Error', { error });
    }
  }

  // Watch for configuration changes
  public watchConfig(): void {
    fs.watch(this.configPath, (eventType) => {
      if (eventType === 'change') {
        this.reload();
      }
    });
  }
}

// Export singleton instance
const config = ConfigManager.getInstance();
export default config;
