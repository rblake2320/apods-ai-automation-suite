import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { MCPService } from '../services/mcpService';
import { WebSocketService } from '../services/websocketService';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * MCP Server Controller
 * Handles HTTP requests for MCP server management
 */
export class MCPController {
  /**
   * Create a new MCP server configuration
   * POST /api/v1/mcp/servers
   */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { name, description, command, args, env } = req.body;

    const server = await MCPService.create(userId, {
      name,
      description,
      command,
      args,
      env,
    });

    logger.info(`MCP server created: ${server.id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'MCP server created successfully',
      data: server,
    };

    res.status(201).json(response);
  });

  /**
   * Get all MCP servers for current user
   * GET /api/v1/mcp/servers
   */
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const servers = await MCPService.getAll(userId);

    const response: ApiResponse = {
      status: 'success',
      data: servers,
    };

    res.status(200).json(response);
  });

  /**
   * Get MCP server by ID
   * GET /api/v1/mcp/servers/:id
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const server = await MCPService.getById(id, userId);

    const response: ApiResponse = {
      status: 'success',
      data: server,
    };

    res.status(200).json(response);
  });

  /**
   * Update MCP server
   * PUT /api/v1/mcp/servers/:id
   */
  static update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const server = await MCPService.update(id, userId, updates);

    logger.info(`MCP server updated: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'MCP server updated successfully',
      data: server,
    };

    res.status(200).json(response);
  });

  /**
   * Delete MCP server
   * DELETE /api/v1/mcp/servers/:id
   */
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await MCPService.delete(id, userId);

    logger.info(`MCP server deleted: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'MCP server deleted successfully',
    };

    res.status(200).json(response);
  });

  /**
   * Start MCP server
   * POST /api/v1/mcp/servers/:id/start
   */
  static start = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const server = await MCPService.start(id, userId);

    logger.info(`MCP server started: ${id} by user ${userId}`);

    // Send WebSocket notification
    WebSocketService.notifyServerStatus(userId, id, 'active', {
      message: 'Server started successfully',
    });

    const response: ApiResponse = {
      status: 'success',
      message: 'MCP server started successfully',
      data: server,
    };

    res.status(200).json(response);
  });

  /**
   * Stop MCP server
   * POST /api/v1/mcp/servers/:id/stop
   */
  static stop = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const server = await MCPService.stop(id, userId);

    logger.info(`MCP server stopped: ${id} by user ${userId}`);

    // Send WebSocket notification
    WebSocketService.notifyServerStatus(userId, id, 'inactive', {
      message: 'Server stopped successfully',
    });

    const response: ApiResponse = {
      status: 'success',
      message: 'MCP server stopped successfully',
      data: server,
    };

    res.status(200).json(response);
  });

  /**
   * Restart MCP server
   * POST /api/v1/mcp/servers/:id/restart
   */
  static restart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const server = await MCPService.restart(id, userId);

    logger.info(`MCP server restarted: ${id} by user ${userId}`);

    // Send WebSocket notification
    WebSocketService.notifyServerStatus(userId, id, 'active', {
      message: 'Server restarted successfully',
    });

    const response: ApiResponse = {
      status: 'success',
      message: 'MCP server restarted successfully',
      data: server,
    };

    res.status(200).json(response);
  });

  /**
   * Get MCP server status
   * GET /api/v1/mcp/servers/:id/status
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const status = await MCPService.getStatus(id, userId);

    const response: ApiResponse = {
      status: 'success',
      data: status,
    };

    res.status(200).json(response);
  });

  /**
   * Perform health check on MCP server
   * GET /api/v1/mcp/servers/:id/health
   */
  static healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const health = await MCPService.healthCheck(id, userId);

    const response: ApiResponse = {
      status: 'success',
      data: health,
    };

    res.status(200).json(response);
  });
}
