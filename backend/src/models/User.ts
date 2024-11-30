import { ObjectId } from 'mongodb';

export interface UserRole {
  'user': number;
  'admin': number;
  'researcher': number;
}

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: keyof UserRole;
  profile: {
    firstName?: string;
    lastName?: string;
    institution?: string;
    specialization?: string;
  };
  metadata: {
    createdAt: Date;
    lastLogin?: Date;
    status: 'active' | 'inactive' | 'suspended';
  };
  permissions: string[];
}

export const ROLES: UserRole = {
  'user': 1,
  'admin': 2,
  'researcher': 3
};
