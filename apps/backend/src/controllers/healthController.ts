import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { db } from '../config/database';
import { WebSocketService } from '../services/websocketService';
import { ApiResponse, HealthCheckResult } from '../types';
import { env } from '../config/env';

/**
 * Health Controller
 * Handles health check and status endpoints
 */
export class HealthController {
  /**
   * Basic health check
   * GET /health
   */
  static healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const uptime = process.uptime();

    const health: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date(),
      uptime,
      services: {
        database: db.isConnected(),
        mcp: true, // MCP service is always available
        ai: !!env.ANTHROPIC_API_KEY,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    // Check if all services are healthy
    const allHealthy = Object.values(health.services).every((service) => service);

    if (!allHealthy) {
      health.status = 'unhealthy';
      res.status(503);
    }

    const response: ApiResponse<HealthCheckResult> = {
      status: 'success',
      data: health,
    };

    res.json(response);
  });

  /**
   * Detailed status information
   * GET /api/v1/status
   */
  static status = asyncHandler(async (req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const status = {
      server: {
        environment: env.NODE_ENV,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      services: {
        database: {
          connected: db.isConnected(),
          type: 'in-memory',
          stats: {
            users: db.getUsers().length,
            projects: db.getProjects().length,
            tasks: db.getAutomationTasks().length,
            mcpServers: db.getMCPServers().length,
          },
        },
        websocket: {
          enabled: true,
          connections: WebSocketService.getConnectedClientsCount(),
        },
        ai: {
          configured: !!env.ANTHROPIC_API_KEY,
          model: env.ANTHROPIC_MODEL,
        },
        playwright: {
          headless: env.PLAYWRIGHT_HEADLESS,
          timeout: env.PLAYWRIGHT_TIMEOUT,
        },
      },
    };

    const response: ApiResponse = {
      status: 'success',
      data: status,
    };

    res.status(200).json(response);
  });

  /**
   * Readiness probe
   * GET /ready
   */
  static ready = asyncHandler(async (req: Request, res: Response) => {
    // Check if all required services are ready
    const isReady = db.isConnected();

    if (isReady) {
      res.status(200).json({
        status: 'success',
        message: 'Server is ready',
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Server is not ready',
      });
    }
  });

  /**
   * Liveness probe
   * GET /alive
   */
  static alive = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is alive',
      timestamp: new Date(),
    });
  });

  /**
   * API information
   * GET /api/v1/info
   */
  static info = asyncHandler(async (req: Request, res: Response) => {
    const info = {
      name: 'APODS AI Automation Suite API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'Backend API for APODS AI-Automation Suite',
      environment: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
      documentation: `${req.protocol}://${req.get('host')}/api-docs`,
      endpoints: {
        health: '/health',
        status: '/api/v1/status',
        auth: '/api/v1/auth',
        projects: '/api/v1/projects',
        automation: '/api/v1/automation',
        mcp: '/api/v1/mcp',
      },
    };

    const response: ApiResponse = {
      status: 'success',
      data: info,
    };

    res.status(200).json(response);
  });
}
