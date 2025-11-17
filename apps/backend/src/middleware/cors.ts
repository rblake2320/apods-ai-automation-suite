import cors, { CorsOptions } from 'cors';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * CORS configuration
 */
const corsOptions: CorsOptions = {
  // Allow requests from specific origins
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Parse allowed origins from environment
    const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

    // Allow all origins in development with wildcard
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Check if origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: env.CORS_CREDENTIALS,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
    'Accept',
    'Origin',
  ],

  // Exposed headers (accessible to the client)
  exposedHeaders: [
    'X-Request-Id',
    'X-Response-Time',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],

  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours

  // Success status for OPTIONS requests
  optionsSuccessStatus: 204,
};

/**
 * CORS middleware
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Permissive CORS for development
 */
export const devCorsMiddleware = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  exposedHeaders: '*',
});
