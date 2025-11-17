import http from 'http';
import { Application } from 'express';
import { connectDatabase, disconnectDatabase } from './config/database';
import { WebSocketService } from './services/websocketService';
import { FileService } from './services/fileService';
import { PlaywrightService } from './services/playwrightService';
import { handleUncaughtException, handleUnhandledRejection } from './middleware/errorHandler';
import logger from './utils/logger';
import { env } from './config/env';

/**
 * Server class
 * Manages HTTP server lifecycle
 */
export class Server {
  private app: Application;
  private httpServer: http.Server | null = null;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Starts the server
   * @returns HTTP server instance
   */
  async start(): Promise<http.Server> {
    try {
      // Setup error handlers
      handleUncaughtException();
      handleUnhandledRejection();

      // Initialize database
      await connectDatabase();
      logger.info('Database connection established');

      // Initialize file service
      await FileService.initialize();
      logger.info('File service initialized');

      // Create HTTP server
      this.httpServer = http.createServer(this.app);

      // Initialize WebSocket service
      WebSocketService.initialize(this.httpServer);
      logger.info('WebSocket service initialized');

      // Start listening
      await new Promise<void>((resolve) => {
        this.httpServer!.listen(env.PORT, env.HOST, () => {
          logger.info(`Server is running on ${env.HOST}:${env.PORT} in ${env.NODE_ENV} mode`);
          logger.info(`API available at http://${env.HOST}:${env.PORT}${env.API_PREFIX}`);
          logger.info(`WebSocket available at ws://${env.HOST}:${env.PORT}${env.WS_PATH}`);
          resolve();
        });
      });

      return this.httpServer;
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Stops the server gracefully
   */
  async stop(): Promise<void> {
    logger.info('Shutting down server...');

    try {
      // Close WebSocket connections
      WebSocketService.close();
      logger.info('WebSocket service closed');

      // Close Playwright browser
      await PlaywrightService.closeBrowser();
      logger.info('Playwright browser closed');

      // Disconnect database
      await disconnectDatabase();
      logger.info('Database connection closed');

      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve, reject) => {
          this.httpServer!.close((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        logger.info('HTTP server closed');
      }

      logger.info('Server shutdown complete');
    } catch (error) {
      logger.error('Error during server shutdown:', error);
      throw error;
    }
  }

  /**
   * Gets the HTTP server instance
   * @returns HTTP server instance or null
   */
  getHttpServer(): http.Server | null {
    return this.httpServer;
  }
}

/**
 * Graceful shutdown handler
 * @param server - Server instance
 */
export function setupGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    try {
      await server.stop();
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
