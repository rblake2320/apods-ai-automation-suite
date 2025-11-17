import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../types';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request
 */
export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = JwtUtil.extractTokenFromHeader(authHeader);

    if (!token) {
      throw ApiError.unauthorized('No authentication token provided');
    }

    // Verify token
    const decoded = JwtUtil.verifyAccessToken(token);

    // Attach user information to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || UserRole.USER,
    };

    next();
  }
);

/**
 * Optional authentication middleware
 * Attaches user information if token is present, but doesn't fail if missing
 */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = JwtUtil.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = JwtUtil.verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role || UserRole.USER,
        };
      } catch (error) {
        // Token is invalid, but we continue without authentication
      }
    }

    next();
  }
);

/**
 * Authorization middleware factory
 * Checks if authenticated user has the required role(s)
 * @param roles - Array of allowed roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
};

/**
 * Admin-only middleware
 * Ensures the authenticated user is an admin
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * Resource ownership middleware factory
 * Checks if the authenticated user owns the resource or is an admin
 * @param userIdParam - Name of the parameter containing the user ID to check
 */
export const requireOwnership = (userIdParam = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];

    if (!resourceUserId) {
      throw ApiError.badRequest(`Missing ${userIdParam} parameter`);
    }

    // Allow access if user is admin or owns the resource
    if (req.user.role === UserRole.ADMIN || req.user.userId === resourceUserId) {
      return next();
    }

    throw ApiError.forbidden('You do not have permission to access this resource');
  };
};
