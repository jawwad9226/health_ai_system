import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { 
  UserManagementService, 
  UserRole, 
  User, 
  UserProfile as ServiceUserProfile, 
  RegisterUserInput, 
  AuthResult 
} from '../services/userManagement';
import { auth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Define API response interfaces
interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

const convertToUserResponse = (user: ServiceUserProfile, id?: string): UserResponse => {
  return {
    id: id || '',
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  };
};

export function setupUserRoutes(router: Router, userService: UserManagementService): void {
  // User Registration
  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, role, firstName, lastName } = req.body;
      
      // Validate role
      if (role && !Object.values(UserRole).includes(role)) {
        throw new AppError(400, 'Invalid role specified');
      }

      const input: RegisterUserInput = {
        email,
        passwordHash: password,
        role: role || UserRole.USER,
        username: email, // Using email as username
        profile: {
          firstName,
          lastName
        },
        permissions: []
      };

      const userId = await userService.registerUser(input);

      res.status(201).json({ 
        message: 'User registered successfully', 
        userId
      });
    } catch (error) {
      logger.error('User registration error:', error);
      next(error);
    }
  });

  // User Login
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const authResult: AuthResult = await userService.loginUser(email, password);

      const userResponse = convertToUserResponse(authResult.user);

      res.json({ 
        message: 'Login successful', 
        token: authResult.token,
        user: userResponse
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  });

  // Get User Profile
  router.get('/:userId', auth(), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = new ObjectId(req.params.userId);
      const user = await userService.getUserProfile(userId);
      
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const userResponse = convertToUserResponse(user, userId.toString());
      res.json(userResponse);
    } catch (error) {
      logger.error('Get user profile error:', error);
      next(error);
    }
  });

  // Update User Profile
  router.put('/:userId', auth(), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = new ObjectId(req.params.userId);
      const updates: Partial<Omit<User, '_id' | 'password' | 'email'>> = {
        firstName: req.body.firstName,
        lastName: req.body.lastName
      };

      const updatedUser = await userService.updateUserProfile(userId, updates);
      if (!updatedUser) {
        throw new AppError(404, 'User not found');
      }

      const userResponse = convertToUserResponse(updatedUser, userId.toString());
      res.json(userResponse);
    } catch (error) {
      logger.error('Update user error:', error);
      next(error);
    }
  });

  // Delete User
  router.delete('/:userId', auth(['admin']), async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.deleteUser(req.params.userId);
      res.status(204).send();
    } catch (error) {
      logger.error('Delete user error:', error);
      next(error);
    }
  });

  // Admin: Get All Users
  router.get('/', auth(['admin']), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.getAllUsers();
      const userResponses = users.map(user => convertToUserResponse(user));
      res.json(userResponses);
    } catch (error) {
      logger.error('Get all users error:', error);
      next(error);
    }
  });
}
