import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from './middleware/cors';
import { requestId, requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeInput } from './middleware/validator';
import routes from './routes';
import { env } from './config/env';
import logger from './utils/logger';

/**
 * Creates and configures the Express application
 * @returns Configured Express application
 */
export function createApp(): Application {
  const app = express();

  // Trust proxy (for running behind reverse proxies like Nginx)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS middleware
  app.use(corsMiddleware);

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID and logging middleware
  app.use(requestId);
  app.use(requestLogger);

  // Input sanitization middleware
  app.use(sanitizeInput);

  // Health check endpoint (before API prefix)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is healthy',
      timestamp: new Date(),
    });
  });

  // API routes
  app.use(env.API_PREFIX, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express application configured');

  return app;
}

export default createApp;
