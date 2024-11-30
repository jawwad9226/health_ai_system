import { MongoClient, Collection, ObjectId } from 'mongodb';
import Redis from 'ioredis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppConfig } from '../utils/config';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Define interfaces
export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  token: string;
  user: UserProfile;
}

export interface RegisterUserInput {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  profile: {
    firstName?: string;
    lastName?: string;
  };
  permissions: string[];
}

export class UserManagementService {
  private collection: Collection<User>;
  private redisClient: Redis;
  private config: AppConfig;

  constructor(mongoClient: MongoClient, redisClient: Redis, config: AppConfig) {
    this.collection = mongoClient.db(config.database.dbName).collection<User>('users');
    this.redisClient = redisClient;
    this.config = config;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateToken(user: User): string {
    const payload = {
      id: user._id?.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.config.security.jwtSecret, {
      expiresIn: '24h'
    });
  }

  private async cacheUserProfile(userId: string, profile: UserProfile): Promise<void> {
    await this.redisClient.setex(
      `user:${userId}:profile`,
      3600, // 1 hour
      JSON.stringify(profile)
    );
  }

  public async createUser(userProfile: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const existingUser = await this.collection.findOne({ email: userProfile.email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.hashPassword(userProfile.password);
    const now = new Date();

    const newUser: User = {
      ...userProfile,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    const result = await this.collection.insertOne(newUser);
    newUser._id = result.insertedId;

    return newUser;
  }

  public async authenticateUser(credentials: UserCredentials): Promise<AuthResult> {
    const user = await this.collection.findOne({ email: credentials.email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.comparePassword(credentials.password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Update last login
    await this.collection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const profile: UserProfile = {
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    const token = this.generateToken(user);

    // Cache user profile
    if (user._id) {
      await this.cacheUserProfile(user._id.toString(), profile);
    }

    return { token, user: profile };
  }

  public async getUserProfile(userId: ObjectId): Promise<UserProfile | null> {
    // Try to get from cache first
    const cachedProfile = await this.redisClient.get(`user:${userId}:profile`);
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }

    // Get from database if not in cache
    const user = await this.collection.findOne({ _id: userId });
    if (!user) {
      return null;
    }

    const profile: UserProfile = {
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Cache the profile
    await this.cacheUserProfile(userId.toString(), profile);

    return profile;
  }

  public async updateUserProfile(
    userId: ObjectId,
    updates: Partial<Omit<User, '_id' | 'password' | 'email'>>
  ): Promise<User | null> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (result) {
      // Invalidate cache
      await this.redisClient.del(`user:${userId}:profile`);
    }

    return result;
  }

  public async changePassword(userId: ObjectId, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.collection.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    const result = await this.collection.updateOne(
      { _id: userId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount === 1;
  }

  public async deactivateUser(userId: ObjectId): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: userId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 1) {
      // Invalidate cache
      await this.redisClient.del(`user:${userId}:profile`);
      return true;
    }

    return false;
  }

  public async registerUser(input: RegisterUserInput): Promise<string> {
    const user = await this.createUser({
      email: input.email,
      password: input.passwordHash,
      role: input.role,
      firstName: input.profile.firstName || '',
      lastName: input.profile.lastName || '',
      isActive: true
    });

    return user._id!.toString();
  }

  public async loginUser(email: string, password: string): Promise<AuthResult> {
    return this.authenticateUser({ email, password });
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    const users = await this.collection.find().toArray();
    return users.map(user => ({
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }));
  }

  public async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const objectId = new ObjectId(userId);
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    const objectId = new ObjectId(userId);
    const result = await this.collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new Error('User not found');
    }

    // Clear cache
    await this.redisClient.del(`user:${userId}:profile`);
  }
}
