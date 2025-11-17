import { MCPServer } from '../models/MCPServer';
import { db } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { IMCPServer, MCPServerStatus } from '../types';
import logger from '../utils/logger';
import { spawn, ChildProcess } from 'child_process';

/**
 * MCP (Model Context Protocol) Server Service
 * Handles MCP server configuration and management
 */
export class MCPService {
  private static runningServers: Map<string, ChildProcess> = new Map();

  /**
   * Creates a new MCP server configuration
   * @param userId - User ID
   * @param data - Server data
   * @returns Created server
   */
  static async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      command: string;
      args?: string[];
      env?: Record<string, string>;
    }
  ): Promise<IMCPServer> {
    const server = MCPServer.create({
      userId,
      ...data,
    });

    db.createMCPServer(server);

    logger.info(`MCP server created: ${server.name} by user ${userId}`);

    return server.toJSON();
  }

  /**
   * Gets a server by ID
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   * @returns Server
   */
  static async getById(serverId: string, userId: string): Promise<IMCPServer> {
    const server = db.getMCPServerById(serverId);

    if (!server) {
      throw ApiError.notFound('MCP server not found');
    }

    // Check ownership
    if (server.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this server');
    }

    return server;
  }

  /**
   * Gets all servers for a user
   * @param userId - User ID
   * @returns Servers
   */
  static async getAll(userId: string): Promise<IMCPServer[]> {
    return db.getMCPServersByUserId(userId);
  }

  /**
   * Updates a server
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   * @param updates - Server updates
   * @returns Updated server
   */
  static async update(
    serverId: string,
    userId: string,
    updates: Partial<IMCPServer>
  ): Promise<IMCPServer> {
    const server = db.getMCPServerById(serverId);

    if (!server) {
      throw ApiError.notFound('MCP server not found');
    }

    // Check ownership
    if (server.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this server');
    }

    // Stop server if it's running and being updated
    if (this.runningServers.has(serverId)) {
      await this.stop(serverId, userId);
    }

    const serverInstance = new MCPServer(server);
    serverInstance.update(updates);

    const updated = db.updateMCPServer(serverId, serverInstance);

    if (!updated) {
      throw ApiError.internal('Failed to update server');
    }

    logger.info(`MCP server updated: ${serverId} by user ${userId}`);

    return updated;
  }

  /**
   * Deletes a server
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   */
  static async delete(serverId: string, userId: string): Promise<void> {
    const server = db.getMCPServerById(serverId);

    if (!server) {
      throw ApiError.notFound('MCP server not found');
    }

    // Check ownership
    if (server.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this server');
    }

    // Stop server if running
    if (this.runningServers.has(serverId)) {
      await this.stop(serverId, userId);
    }

    const deleted = db.deleteMCPServer(serverId);

    if (!deleted) {
      throw ApiError.internal('Failed to delete server');
    }

    logger.info(`MCP server deleted: ${serverId} by user ${userId}`);
  }

  /**
   * Starts an MCP server
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   * @returns Server status
   */
  static async start(serverId: string, userId: string): Promise<IMCPServer> {
    const server = db.getMCPServerById(serverId);

    if (!server) {
      throw ApiError.notFound('MCP server not found');
    }

    // Check ownership
    if (server.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to start this server');
    }

    // Check if already running
    if (this.runningServers.has(serverId)) {
      throw ApiError.conflict('Server is already running');
    }

    try {
      const serverInstance = new MCPServer(server);

      // Spawn the process
      const process = spawn(server.command, server.args || [], {
        env: { ...process.env, ...server.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle process events
      process.on('error', (error) => {
        logger.error(`MCP server error (${serverId}):`, error);
        serverInstance.markAsError();
        db.updateMCPServer(serverId, serverInstance);
        this.runningServers.delete(serverId);
      });

      process.on('exit', (code) => {
        logger.info(`MCP server exited (${serverId}) with code ${code}`);
        serverInstance.markAsInactive();
        db.updateMCPServer(serverId, serverInstance);
        this.runningServers.delete(serverId);
      });

      // Store the running process
      this.runningServers.set(serverId, process);

      // Mark as active
      serverInstance.markAsActive();
      const updated = db.updateMCPServer(serverId, serverInstance);

      logger.info(`MCP server started: ${serverId}`);

      return updated!;
    } catch (error: any) {
      logger.error(`Failed to start MCP server (${serverId}):`, error);
      throw ApiError.internal(`Failed to start server: ${error.message}`);
    }
  }

  /**
   * Stops an MCP server
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   * @returns Server status
   */
  static async stop(serverId: string, userId: string): Promise<IMCPServer> {
    const server = db.getMCPServerById(serverId);

    if (!server) {
      throw ApiError.notFound('MCP server not found');
    }

    // Check ownership
    if (server.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to stop this server');
    }

    const process = this.runningServers.get(serverId);

    if (!process) {
      throw ApiError.conflict('Server is not running');
    }

    // Kill the process
    process.kill('SIGTERM');

    // Wait a bit for graceful shutdown, then force kill if needed
    setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }, 5000);

    this.runningServers.delete(serverId);

    const serverInstance = new MCPServer(server);
    serverInstance.markAsInactive();
    const updated = db.updateMCPServer(serverId, serverInstance);

    logger.info(`MCP server stopped: ${serverId}`);

    return updated!;
  }

  /**
   * Gets the status of an MCP server
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   * @returns Server status
   */
  static async getStatus(
    serverId: string,
    userId: string
  ): Promise<{
    server: IMCPServer;
    isRunning: boolean;
    pid?: number;
  }> {
    const server = db.getMCPServerById(serverId);

    if (!server) {
      throw ApiError.notFound('MCP server not found');
    }

    // Check ownership
    if (server.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this server');
    }

    const process = this.runningServers.get(serverId);
    const isRunning = !!process && !process.killed;

    return {
      server,
      isRunning,
      pid: process?.pid,
    };
  }

  /**
   * Performs a health check on an MCP server
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   * @returns Health check result
   */
  static async healthCheck(
    serverId: string,
    userId: string
  ): Promise<{
    healthy: boolean;
    message: string;
  }> {
    const server = db.getMCPServerById(serverId);

    if (!server) {
      throw ApiError.notFound('MCP server not found');
    }

    // Check ownership
    if (server.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this server');
    }

    const process = this.runningServers.get(serverId);
    const isRunning = !!process && !process.killed;

    const serverInstance = new MCPServer(server);
    serverInstance.updateHealthCheck();

    if (isRunning) {
      serverInstance.markAsActive();
      db.updateMCPServer(serverId, serverInstance);
      return {
        healthy: true,
        message: 'Server is running',
      };
    } else {
      serverInstance.markAsInactive();
      db.updateMCPServer(serverId, serverInstance);
      return {
        healthy: false,
        message: 'Server is not running',
      };
    }
  }

  /**
   * Restarts an MCP server
   * @param serverId - Server ID
   * @param userId - User ID (for authorization)
   * @returns Server status
   */
  static async restart(serverId: string, userId: string): Promise<IMCPServer> {
    // Stop if running
    if (this.runningServers.has(serverId)) {
      await this.stop(serverId, userId);
      // Wait a bit before starting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Start the server
    return this.start(serverId, userId);
  }
}
