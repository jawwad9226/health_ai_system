import RedisService from '../config/redis';
import { logger } from '../utils/logger';

interface Session {
  userId: string;
  role: string;
  lastAccess: Date;
  data?: any;
}

class SessionManager {
  private static instance: SessionManager;
  private redis: RedisService;
  private readonly prefix = 'session:';
  private readonly ttl = 24 * 60 * 60; // 24 hours

  private constructor() {
    this.redis = RedisService.getInstance();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  public async createSession(sessionId: string, data: Session): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      await this.redis.set(key, {
        ...data,
        lastAccess: new Date(),
      }, this.ttl);
      
      // Add to user's sessions set
      await this.redis.addToSet(`user_sessions:${data.userId}`, sessionId);
      
      logger.debug(`Session created: ${sessionId}`);
    } catch (error) {
      logger.error('Session creation error:', error);
      throw error;
    }
  }

  public async getSession(sessionId: string): Promise<Session | null> {
    try {
      const key = this.getKey(sessionId);
      const session = await this.redis.get(key);
      
      if (session) {
        // Update last access time
        await this.updateSessionAccess(sessionId);
      }
      
      return session;
    } catch (error) {
      logger.error('Session retrieval error:', error);
      throw error;
    }
  }

  public async updateSession(sessionId: string, data: Partial<Session>): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const session = await this.redis.get(key);
      
      if (!session) {
        throw new Error('Session not found');
      }

      await this.redis.set(key, {
        ...session,
        ...data,
        lastAccess: new Date(),
      }, this.ttl);
      
      logger.debug(`Session updated: ${sessionId}`);
    } catch (error) {
      logger.error('Session update error:', error);
      throw error;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const session = await this.redis.get(key);
      
      if (session) {
        await this.redis.del(key);
        // Remove from user's sessions set
        await this.redis.delHash(`user_sessions:${session.userId}`, sessionId);
      }
      
      logger.debug(`Session deleted: ${sessionId}`);
    } catch (error) {
      logger.error('Session deletion error:', error);
      throw error;
    }
  }

  public async getUserSessions(userId: string): Promise<string[]> {
    try {
      return await this.redis.getSet(`user_sessions:${userId}`);
    } catch (error) {
      logger.error('Get user sessions error:', error);
      throw error;
    }
  }

  private async updateSessionAccess(sessionId: string): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const session = await this.redis.get(key);
      
      if (session) {
        session.lastAccess = new Date();
        await this.redis.set(key, session, this.ttl);
      }
    } catch (error) {
      logger.error('Session access update error:', error);
      throw error;
    }
  }

  public async clearExpiredSessions(): Promise<void> {
    try {
      // This is handled automatically by Redis TTL
      logger.debug('Expired sessions cleared');
    } catch (error) {
      logger.error('Clear expired sessions error:', error);
      throw error;
    }
  }
}

export default SessionManager;
