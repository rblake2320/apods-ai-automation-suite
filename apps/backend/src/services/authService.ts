import { User } from '../models/User';
import { db } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { JwtUtil, JwtPayload } from '../utils/jwt';
import { RegisterData, LoginCredentials, AuthTokens } from '../types';
import logger from '../utils/logger';

/**
 * Authentication Service
 * Handles user authentication logic
 */
export class AuthService {
  /**
   * Registers a new user
   * @param data - Registration data
   * @returns Created user (without password) and tokens
   */
  static async register(data: RegisterData): Promise<{
    user: Omit<typeof User.prototype, 'password'>;
    tokens: AuthTokens;
  }> {
    // Check if user already exists
    const existingUser = db.getUserByEmail(data.email);
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Create new user with hashed password
    const user = await User.create(data);

    // Save user to database
    db.createUser(user);

    logger.info(`New user registered: ${user.email}`);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: user.toSafeObject(),
      tokens,
    };
  }

  /**
   * Authenticates a user and returns tokens
   * @param credentials - Login credentials
   * @returns User (without password) and tokens
   */
  static async login(credentials: LoginCredentials): Promise<{
    user: Omit<typeof User.prototype, 'password'>;
    tokens: AuthTokens;
  }> {
    // Find user by email
    const user = db.getUserByEmail(credentials.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Create User instance to use verifyPassword method
    const userInstance = new User(user);

    // Verify password
    const isPasswordValid = await userInstance.verifyPassword(credentials.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate tokens
    const tokens = this.generateTokens(userInstance);

    return {
      user: userInstance.toSafeObject(),
      tokens,
    };
  }

  /**
   * Refreshes access token using refresh token
   * @param refreshToken - Refresh token
   * @returns New access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const decoded = JwtUtil.verifyRefreshToken(refreshToken);

    // Find user
    const user = db.getUserById(decoded.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    // Generate new tokens
    const userInstance = new User(user);
    const tokens = this.generateTokens(userInstance);

    logger.info(`Token refreshed for user: ${user.email}`);

    return tokens;
  }

  /**
   * Validates a token and returns user information
   * @param token - JWT token
   * @returns User information
   */
  static async validateToken(token: string): Promise<JwtPayload> {
    const decoded = JwtUtil.verifyAccessToken(token);

    // Verify user still exists and is active
    const user = db.getUserById(decoded.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    return decoded;
  }

  /**
   * Changes user password
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = db.getUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userInstance = new User(user);

    // Verify current password
    const isPasswordValid = await userInstance.verifyPassword(currentPassword);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Update password
    await userInstance.updatePassword(newPassword);

    // Save updated user
    db.updateUser(userId, userInstance);

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Generates access and refresh tokens for a user
   * @param user - User instance
   * @returns Authentication tokens
   */
  private static generateTokens(user: User): AuthTokens {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return JwtUtil.generateTokens(payload);
  }

  /**
   * Deactivates a user account
   * @param userId - User ID
   */
  static async deactivateAccount(userId: string): Promise<void> {
    const user = db.getUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userInstance = new User(user);
    userInstance.deactivate();

    db.updateUser(userId, userInstance);

    logger.info(`Account deactivated: ${user.email}`);
  }

  /**
   * Reactivates a user account
   * @param userId - User ID
   */
  static async reactivateAccount(userId: string): Promise<void> {
    const user = db.getUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userInstance = new User(user);
    userInstance.activate();

    db.updateUser(userId, userInstance);

    logger.info(`Account reactivated: ${user.email}`);
  }
}
