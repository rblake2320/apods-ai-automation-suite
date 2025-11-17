import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;

    const result = await AuthService.register({ email, password, name, role });

    logger.info(`User registered: ${email}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'User registered successfully',
      data: result,
    };

    res.status(201).json(response);
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });

    logger.info(`User logged in: ${email}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Login successful',
      data: result,
    };

    res.status(200).json(response);
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const tokens = await AuthService.refreshToken(refreshToken);

    const response: ApiResponse = {
      status: 'success',
      message: 'Token refreshed successfully',
      data: { tokens },
    };

    res.status(200).json(response);
  });

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // In a real app, fetch from database
    const response: ApiResponse = {
      status: 'success',
      data: {
        userId: req.user!.userId,
        email: req.user!.email,
        role: req.user!.role,
      },
    };

    res.status(200).json(response);
  });

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(userId, currentPassword, newPassword);

    logger.info(`Password changed for user: ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Password changed successfully',
    };

    res.status(200).json(response);
  });

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    // In a real implementation with sessions or token blacklisting,
    // you would invalidate the session/token here

    logger.info(`User logged out: ${req.user!.userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Logout successful',
    };

    res.status(200).json(response);
  });

  /**
   * Validate token
   * GET /api/v1/auth/validate
   */
  static validateToken = asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
    }

    const decoded = await AuthService.validateToken(token);

    const response: ApiResponse = {
      status: 'success',
      message: 'Token is valid',
      data: decoded,
    };

    res.status(200).json(response);
  });
}
