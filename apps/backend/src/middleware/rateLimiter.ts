import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * Rate limiter configuration for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for admin users
    return req.user?.role === 'admin';
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many authentication attempts, please try again later.',
    });
  },
});

/**
 * Rate limiter for file upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many file uploads, please try again later.',
    });
  },
});

/**
 * Rate limiter for automation task execution
 */
export const automationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 task executions per minute
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many automation tasks triggered, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Automation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many automation tasks triggered, please slow down.',
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for admin users
    return req.user?.role === 'admin';
  },
});

/**
 * Lenient rate limiter for read operations
 */
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 read requests per minute
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for authenticated users
    return !!req.user;
  },
});
