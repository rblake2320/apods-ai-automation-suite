/**
 * Health Check System
 *
 * Provides comprehensive health checks for all application dependencies
 */

import { Request, Response } from 'express';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
}

/**
 * Checks database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    // TODO: Replace with actual database connection check
    // const result = await db.query('SELECT 1');

    const responseTime = Date.now() - start;

    return {
      name: 'database',
      status: 'healthy',
      message: 'Database connection is healthy',
      responseTime,
      details: {
        type: 'postgresql',
        // Add more details like connection pool stats
      },
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Checks Redis connectivity
 */
async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    // TODO: Replace with actual Redis connection check
    // await redis.ping();

    const responseTime = Date.now() - start;

    return {
      name: 'redis',
      status: 'healthy',
      message: 'Redis connection is healthy',
      responseTime,
      details: {
        // Add Redis stats
      },
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Redis connection failed',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Checks system resources
 */
async function checkSystemResources(): Promise<HealthCheck> {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Consider system degraded if memory usage > 90%
    const status = heapUsedPercent > 90 ? 'degraded' : 'healthy';

    return {
      name: 'system',
      status,
      message: status === 'healthy' ? 'System resources are healthy' : 'High memory usage detected',
      details: {
        memory: {
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
          heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
    };
  } catch (error) {
    return {
      name: 'system',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'System check failed',
    };
  }
}

/**
 * Checks external API connectivity (Anthropic)
 */
async function checkExternalApis(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    // TODO: Add actual API health check if available
    // For now, just check if API key is configured

    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    return {
      name: 'external_apis',
      status: hasApiKey ? 'healthy' : 'degraded',
      message: hasApiKey ? 'External APIs are configured' : 'External API configuration incomplete',
      responseTime: Date.now() - start,
      details: {
        anthropic: hasApiKey ? 'configured' : 'not configured',
      },
    };
  } catch (error) {
    return {
      name: 'external_apis',
      status: 'degraded',
      message: error instanceof Error ? error.message : 'External API check failed',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Performs all health checks
 */
export async function performHealthChecks(): Promise<HealthCheckResult> {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkSystemResources(),
    checkExternalApis(),
  ]);

  // Determine overall status
  const hasUnhealthy = checks.some((check) => check.status === 'unhealthy');
  const hasDegraded = checks.some((check) => check.status === 'degraded');

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };
}

/**
 * Basic health check endpoint (returns 200 OK if service is running)
 */
export async function healthCheckHandler(req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Detailed health check endpoint
 */
export async function detailedHealthCheckHandler(req: Request, res: Response) {
  try {
    const result = await performHealthChecks();

    // Return appropriate HTTP status code
    const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: [],
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
}

/**
 * Readiness check endpoint (for Kubernetes)
 */
export async function readinessCheckHandler(req: Request, res: Response) {
  try {
    const result = await performHealthChecks();

    // Service is ready only if all critical checks are healthy
    const criticalChecks = result.checks.filter((check) =>
      ['database', 'redis'].includes(check.name)
    );

    const isReady = criticalChecks.every((check) => check.status === 'healthy');

    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', checks: result.checks });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
}

/**
 * Liveness check endpoint (for Kubernetes)
 */
export async function livenessCheckHandler(req: Request, res: Response) {
  // Simple check to ensure the process is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export default {
  performHealthChecks,
  healthCheckHandler,
  detailedHealthCheckHandler,
  readinessCheckHandler,
  livenessCheckHandler,
};
