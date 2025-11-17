/**
 * Express type augmentation
 * Extends Express Request interface to include custom properties
 */

import { IUser } from './index';

declare global {
  namespace Express {
    /**
     * Extends the Express Request interface
     */
    interface Request {
      /**
       * Authenticated user information
       * Set by the auth middleware after JWT verification
       */
      user?: {
        userId: string;
        email: string;
        role: string;
      };

      /**
       * Request ID for tracing
       */
      requestId?: string;

      /**
       * Request start time for performance tracking
       */
      startTime?: number;

      /**
       * File upload information
       */
      file?: Express.Multer.File;

      /**
       * Multiple file uploads
       */
      files?: Express.Multer.File[];
    }
  }
}

/**
 * Custom error interface for Express error handlers
 */
export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errors?: any[];
}
