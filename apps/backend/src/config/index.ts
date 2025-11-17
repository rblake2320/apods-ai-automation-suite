/**
 * Centralized configuration management
 * Exports all configuration modules
 */

import { env, isProduction, isDevelopment, isTest } from './env';
import { db, connectDatabase, disconnectDatabase } from './database';
import logger, { loggerStream } from './logger';

/**
 * Application configuration
 */
export const config = {
  // Environment
  env: env.NODE_ENV,
  isProduction,
  isDevelopment,
  isTest,

  // Server
  server: {
    port: env.PORT,
    host: env.HOST,
    apiPrefix: env.API_PREFIX,
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },

  // Database
  database: {
    url: env.DATABASE_URL,
    name: env.DATABASE_NAME,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
  },

  // Rate limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Anthropic AI
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL,
  },

  // Playwright
  playwright: {
    headless: env.PLAYWRIGHT_HEADLESS,
    timeout: env.PLAYWRIGHT_TIMEOUT,
  },

  // File storage
  fileStorage: {
    uploadDir: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
  },

  // WebSocket
  websocket: {
    port: env.WS_PORT,
    path: env.WS_PATH,
  },

  // MCP
  mcp: {
    configPath: env.MCP_CONFIG_PATH,
  },

  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
  },

  // Frontend
  frontend: {
    url: env.FRONTEND_URL,
  },
};

export { env, db, logger, loggerStream, connectDatabase, disconnectDatabase };
export default config;
