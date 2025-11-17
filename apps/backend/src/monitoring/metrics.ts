/**
 * Prometheus Metrics Configuration
 *
 * This module sets up Prometheus metrics for monitoring the backend application.
 */

import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a Registry
export const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'apods_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics

// HTTP request duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

// HTTP request counter
export const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// HTTP request size summary
export const httpRequestSize = new promClient.Summary({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  registers: [register],
});

// HTTP response size summary
export const httpResponseSize = new promClient.Summary({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  registers: [register],
});

// Active connections gauge
export const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// Database query duration histogram
export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Database connection pool metrics
export const dbPoolSize = new promClient.Gauge({
  name: 'db_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state'], // idle, active
  registers: [register],
});

// Cache hit/miss counter
export const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache'],
  registers: [register],
});

export const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache'],
  registers: [register],
});

// AI API call metrics
export const aiApiCalls = new promClient.Counter({
  name: 'ai_api_calls_total',
  help: 'Total number of AI API calls',
  labelNames: ['provider', 'model', 'status'],
  registers: [register],
});

export const aiApiDuration = new promClient.Histogram({
  name: 'ai_api_duration_seconds',
  help: 'Duration of AI API calls in seconds',
  labelNames: ['provider', 'model'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  registers: [register],
});

// Automation execution metrics
export const automationExecutions = new promClient.Counter({
  name: 'automation_executions_total',
  help: 'Total number of automation executions',
  labelNames: ['automation', 'status'],
  registers: [register],
});

export const automationDuration = new promClient.Histogram({
  name: 'automation_duration_seconds',
  help: 'Duration of automation executions in seconds',
  labelNames: ['automation'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

// WebSocket metrics
export const wsConnections = new promClient.Gauge({
  name: 'websocket_connections',
  help: 'Current number of WebSocket connections',
  registers: [register],
});

export const wsMessages = new promClient.Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['direction'], // sent, received
  registers: [register],
});

// Error counter
export const errorCounter = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

/**
 * Express middleware to track HTTP metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Track active connections
  activeConnections.inc();

  // Track request size
  const requestSize = parseInt(req.get('content-length') || '0', 10);
  if (requestSize > 0) {
    httpRequestSize.observe(
      { method: req.method, route: req.route?.path || req.path },
      requestSize
    );
  }

  // Intercept response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    // Record metrics
    httpRequestDuration.observe({ method: req.method, route, status: res.statusCode }, duration);
    httpRequestCounter.inc({ method: req.method, route, status: res.statusCode });

    // Track response size
    const responseSize = parseInt(res.get('content-length') || '0', 10);
    if (responseSize > 0) {
      httpResponseSize.observe({ method: req.method, route }, responseSize);
    }

    // Decrement active connections
    activeConnections.dec();
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(req: Request, res: Response) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
}

/**
 * Helper function to track database query duration
 */
export function trackDbQuery<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const end = dbQueryDuration.startTimer({ operation, table });
  return queryFn().finally(() => end());
}

/**
 * Helper function to track AI API calls
 */
export function trackAiApiCall<T>(
  provider: string,
  model: string,
  apiFn: () => Promise<T>
): Promise<T> {
  const end = aiApiDuration.startTimer({ provider, model });

  return apiFn()
    .then((result) => {
      aiApiCalls.inc({ provider, model, status: 'success' });
      return result;
    })
    .catch((error) => {
      aiApiCalls.inc({ provider, model, status: 'error' });
      throw error;
    })
    .finally(() => end());
}

/**
 * Helper function to track automation execution
 */
export function trackAutomation<T>(
  automationName: string,
  executionFn: () => Promise<T>
): Promise<T> {
  const end = automationDuration.startTimer({ automation: automationName });

  return executionFn()
    .then((result) => {
      automationExecutions.inc({ automation: automationName, status: 'success' });
      return result;
    })
    .catch((error) => {
      automationExecutions.inc({ automation: automationName, status: 'error' });
      throw error;
    })
    .finally(() => end());
}

export default {
  register,
  metricsMiddleware,
  metricsHandler,
  trackDbQuery,
  trackAiApiCall,
  trackAutomation,
};
