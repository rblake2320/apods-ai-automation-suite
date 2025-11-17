import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { ZodError } from 'zod';
import { env } from '../config/env';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));

    res.status(422).json({
      status: 'error',
      statusCode: 422,
      message: 'Validation error',
      errors,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Invalid token',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Token expired',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    let statusCode = 400;

    if (err.message.includes('File too large')) {
      message = 'File size exceeds the maximum allowed size';
      statusCode = 413;
    }

    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle mongoose/database validation errors (if using MongoDB)
  if (err.name === 'ValidationError') {
    res.status(422).json({
      status: 'error',
      statusCode: 422,
      message: 'Validation error',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle mongoose cast errors
  if (err.name === 'CastError') {
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Invalid ID format',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Default to 500 internal server error
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 * Catches all unhandled routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Route ${req.method} ${req.path} not found`);
  next(error);
};

/**
 * Async error wrapper for unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process in production
    if (env.NODE_ENV === 'development') {
      process.exit(1);
    }
  });
};

/**
 * Handler for uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    // Exit the process as the application is in an undefined state
    process.exit(1);
  });
};
