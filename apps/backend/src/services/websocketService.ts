import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage, WebSocketMessageType } from '../types';
import logger from '../utils/logger';
import { env } from '../config/env';
import { JwtUtil } from '../utils/jwt';
import { parse } from 'url';

/**
 * WebSocket Service
 * Handles real-time communication via WebSockets
 */
export class WebSocketService {
  private static wss: WebSocketServer | null = null;
  private static clients: Map<string, Set<WebSocket>> = new Map();

  /**
   * Initializes the WebSocket server
   * @param server - HTTP server instance
   */
  static initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({
      server,
      path: env.WS_PATH,
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    logger.info(`WebSocket server initialized on path: ${env.WS_PATH}`);
  }

  /**
   * Handles new WebSocket connections
   * @param ws - WebSocket instance
   * @param req - HTTP request
   */
  private static handleConnection(ws: WebSocket, req: any): void {
    try {
      // Extract token from query parameters
      const { query } = parse(req.url, true);
      const token = query.token as string;

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify token
      const decoded = JwtUtil.verifyAccessToken(token);
      const userId = decoded.userId;

      // Store client connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      logger.info(`WebSocket client connected: ${userId}`);

      // Send welcome message
      this.sendToClient(ws, {
        type: WebSocketMessageType.NOTIFICATION,
        data: { message: 'Connected to APODS WebSocket server' },
        timestamp: new Date(),
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, userId, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(userId, ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for user ${userId}:`, error);
      });
    } catch (error) {
      logger.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  /**
   * Handles incoming WebSocket messages
   * @param ws - WebSocket instance
   * @param userId - User ID
   * @param data - Message data
   */
  private static handleMessage(ws: WebSocket, userId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`WebSocket message from ${userId}:`, message);

      // Echo the message back (can be extended with custom logic)
      this.sendToClient(ws, {
        type: WebSocketMessageType.NOTIFICATION,
        data: { echo: message },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handles client disconnection
   * @param userId - User ID
   * @param ws - WebSocket instance
   */
  private static handleDisconnection(userId: string, ws: WebSocket): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
    logger.info(`WebSocket client disconnected: ${userId}`);
  }

  /**
   * Sends a message to a specific client
   * @param ws - WebSocket instance
   * @param message - Message to send
   */
  private static sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Sends a message to a specific user (all their connections)
   * @param userId - User ID
   * @param message - Message to send
   */
  static sendToUser(userId: string, message: WebSocketMessage): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach((ws) => {
        this.sendToClient(ws, message);
      });
      logger.debug(`Sent WebSocket message to user ${userId}`);
    }
  }

  /**
   * Broadcasts a message to all connected clients
   * @param message - Message to broadcast
   */
  static broadcast(message: WebSocketMessage): void {
    if (!this.wss) return;

    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });

    logger.debug('Broadcasted WebSocket message to all clients');
  }

  /**
   * Notifies a user about task status
   * @param userId - User ID
   * @param taskId - Task ID
   * @param status - Task status
   * @param data - Additional data
   */
  static notifyTaskStatus(
    userId: string,
    taskId: string,
    status: 'started' | 'progress' | 'completed' | 'failed',
    data?: any
  ): void {
    const messageTypes: Record<string, WebSocketMessageType> = {
      started: WebSocketMessageType.TASK_STARTED,
      progress: WebSocketMessageType.TASK_PROGRESS,
      completed: WebSocketMessageType.TASK_COMPLETED,
      failed: WebSocketMessageType.TASK_FAILED,
    };

    this.sendToUser(userId, {
      type: messageTypes[status],
      data: {
        taskId,
        ...data,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Notifies a user about server status
   * @param userId - User ID
   * @param serverId - Server ID
   * @param status - Server status
   * @param data - Additional data
   */
  static notifyServerStatus(userId: string, serverId: string, status: string, data?: any): void {
    this.sendToUser(userId, {
      type: WebSocketMessageType.SERVER_STATUS,
      data: {
        serverId,
        status,
        ...data,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Sends a notification to a user
   * @param userId - User ID
   * @param notification - Notification message
   * @param type - Notification type
   */
  static sendNotification(
    userId: string,
    notification: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    this.sendToUser(userId, {
      type: WebSocketMessageType.NOTIFICATION,
      data: {
        message: notification,
        type,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Gets the number of connected clients
   * @returns Number of connected clients
   */
  static getConnectedClientsCount(): number {
    return this.wss?.clients.size || 0;
  }

  /**
   * Gets the number of connections for a specific user
   * @param userId - User ID
   * @returns Number of connections
   */
  static getUserConnectionsCount(userId: string): number {
    return this.clients.get(userId)?.size || 0;
  }

  /**
   * Closes the WebSocket server
   */
  static close(): void {
    if (this.wss) {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
      });
      this.wss = null;
      this.clients.clear();
    }
  }
}
