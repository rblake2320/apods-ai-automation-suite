/**
 * APODS AI Automation Suite - Backend Server
 * Main entry point
 */

import { createApp } from './app';
import { Server, setupGracefulShutdown } from './server';
import logger from './utils/logger';
import { env } from './config/env';

/**
 * Bootstrap function
 * Initializes and starts the server
 */
async function bootstrap() {
  try {
    logger.info('Starting APODS AI Automation Suite Backend...');
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Node version: ${process.version}`);

    // Create Express application
    const app = createApp();

    // Create and start server
    const server = new Server(app);
    await server.start();

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    logger.info('APODS AI Automation Suite Backend started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();

export { createApp };
