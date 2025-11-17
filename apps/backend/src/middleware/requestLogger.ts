import morgan from 'morgan';
import { Request, Response } from 'express';
import { loggerStream } from '../utils/logger';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom Morgan token for request ID
 */
morgan.token('id', (req: Request) => req.requestId || 'unknown');

/**
 * Custom Morgan token for user ID
 */
morgan.token('user', (req: Request) => req.user?.userId || 'anonymous');

/**
 * Custom Morgan token for response time in milliseconds
 */
morgan.token('response-time-ms', (req: Request, res: Response) => {
  if (!req.startTime) return '0';
  const elapsed = Date.now() - req.startTime;
  return `${elapsed}ms`;
});

/**
 * Custom Morgan format for detailed logging
 */
const detailedFormat =
  ':id :user :method :url :status :res[content-length] - :response-time-ms :remote-addr';

/**
 * Custom Morgan format for production (less verbose)
 */
const productionFormat = ':method :url :status :response-time-ms';

/**
 * Request ID middleware
 * Assigns a unique ID to each request for tracing
 */
export const requestId = (req: Request, res: Response, next: () => void): void => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

/**
 * Request logger middleware
 * Uses Morgan to log HTTP requests
 */
export const requestLogger = morgan(
  env.NODE_ENV === 'production' ? productionFormat : detailedFormat,
  {
    stream: loggerStream,
    skip: (req: Request) => {
      // Skip logging for health check endpoints in production
      if (env.NODE_ENV === 'production' && req.path === '/health') {
        return true;
      }
      return false;
    },
  }
);

/**
 * Skip options for development
 */
export const requestLoggerDev = morgan('dev', {
  skip: (req: Request) => req.path === '/health',
});
