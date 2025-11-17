import { IUser, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * User Model
 * Handles user data operations and password management
 */
export class User implements IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IUser>) {
    this.id = data.id || uuidv4();
    this.email = data.email!;
    this.password = data.password!;
    this.name = data.name!;
    this.role = data.role || UserRole.USER;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Hashes a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
  }

  /**
   * Compares a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password
   * @returns True if passwords match, false otherwise
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Creates a new user with hashed password
   * @param data - User data
   * @returns New User instance
   */
  static async create(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<User> {
    const hashedPassword = await User.hashPassword(data.password);
    return new User({
      ...data,
      password: hashedPassword,
    });
  }

  /**
   * Verifies if the provided password matches the user's password
   * @param password - Plain text password to verify
   * @returns True if password matches, false otherwise
   */
  async verifyPassword(password: string): Promise<boolean> {
    return User.comparePassword(password, this.password);
  }

  /**
   * Updates the user's password
   * @param newPassword - New plain text password
   */
  async updatePassword(newPassword: string): Promise<void> {
    this.password = await User.hashPassword(newPassword);
    this.updatedAt = new Date();
  }

  /**
   * Converts user to a safe object (without password)
   * @returns User data without password
   */
  toSafeObject(): Omit<IUser, 'password'> {
    const { password, ...safeUser } = this;
    return safeUser;
  }

  /**
   * Converts user to JSON (without password)
   * @returns User data without password
   */
  toJSON(): Omit<IUser, 'password'> {
    return this.toSafeObject();
  }

  /**
   * Checks if user is an admin
   * @returns True if user is admin, false otherwise
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Deactivates the user account
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Activates the user account
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }
}
