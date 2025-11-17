import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Environment variables validation schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server configuration
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),

  // CORS configuration
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // JWT configuration
  JWT_SECRET: z
    .string()
    .min(32)
    .default('your-secret-key-change-in-production-use-at-least-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32)
    .default('your-refresh-secret-key-change-in-production-use-at-least-32-chars'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // Database configuration (in-memory for now, can be extended for MongoDB/PostgreSQL)
  DATABASE_URL: z.string().optional(),
  DATABASE_NAME: z.string().default('apods'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Anthropic AI configuration
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),

  // Playwright configuration
  PLAYWRIGHT_HEADLESS: z.coerce.boolean().default(true),
  PLAYWRIGHT_TIMEOUT: z.coerce.number().default(30000),

  // File storage
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB

  // WebSocket configuration
  WS_PORT: z.coerce.number().optional(),
  WS_PATH: z.string().default('/ws'),

  // MCP Server configuration
  MCP_CONFIG_PATH: z.string().default('./mcp-servers.json'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(10),
  SESSION_SECRET: z.string().min(32).optional(),

  // Frontend URL for CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
});

/**
 * Validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables
 * @throws ZodError if validation fails
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validated and typed environment variables
 */
export const env = validateEnv();

/**
 * Checks if the application is in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Checks if the application is in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Checks if the application is in test mode
 */
export const isTest = env.NODE_ENV === 'test';
