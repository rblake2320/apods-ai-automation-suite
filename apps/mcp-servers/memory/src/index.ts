/**
 * Memory MCP Server
 * Provides in-memory key-value storage through Model Context Protocol
 */

import * as readline from 'readline';
import { handleStore, handleUpdate, handleBatchStore, handleExists } from './handlers/store.js';
import {
  handleRetrieve,
  handleRetrieveMultiple,
  handleList,
  handleSize,
  handleKeys,
} from './handlers/retrieve.js';
import {
  handleSearch,
  handleSearchByTag,
  handleSearchByType,
  handleGetStats,
} from './handlers/search.js';
import {
  handleDelete,
  handleDeleteMultiple,
  handleDeleteByPattern,
  handleDeleteByTag,
  handleClear,
  handleDeleteExpired,
} from './handlers/delete.js';
import { MemoryStore } from './store.js';
import {
  validateJsonRpcRequest,
  createErrorResponse,
  createSuccessResponse,
  RateLimiter,
} from '../../shared/utils.js';
import { ErrorCode, JsonRpcRequest, JsonRpcResponse, MCPServerConfig } from '../../shared/types.js';
import { createLogger, Logger } from '../../shared/logger.js';

interface MemoryConfig {
  persistPath?: string;
  autoSaveMs?: number;
  cleanupIntervalMs?: number;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

class MemoryMCPServer {
  private logger: Logger;
  private config: MCPServerConfig;
  private memoryConfig: MemoryConfig;
  private store: MemoryStore;
  private rateLimiter?: RateLimiter;
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: MemoryConfig) {
    this.startTime = Date.now();
    this.memoryConfig = {
      persistPath: config.persistPath,
      autoSaveMs: config.autoSaveMs || 60000, // 1 minute default
      cleanupIntervalMs: config.cleanupIntervalMs || 300000, // 5 minutes default
    };

    this.logger = createLogger({
      level: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
      serverName: 'memory-mcp',
      logToFile: process.env.LOG_TO_FILE === 'true',
      logDir: process.env.LOG_DIR || './logs',
    });

    this.store = new MemoryStore(this.memoryConfig.persistPath, this.memoryConfig.autoSaveMs);

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit.maxRequests, config.rateLimit.windowMs);
    }

    this.config = {
      name: 'memory',
      version: '1.0.0',
      description: 'In-memory key-value storage MCP server',
      capabilities: [
        'memory.store',
        'memory.update',
        'memory.batchStore',
        'memory.exists',
        'memory.retrieve',
        'memory.retrieveMultiple',
        'memory.list',
        'memory.size',
        'memory.keys',
        'memory.search',
        'memory.searchByTag',
        'memory.searchByType',
        'memory.getStats',
        'memory.delete',
        'memory.deleteMultiple',
        'memory.deleteByPattern',
        'memory.deleteByTag',
        'memory.clear',
        'memory.deleteExpired',
        'memory.persist',
        'memory.backup',
        'memory.restore',
      ],
      transport: 'stdio',
    };

    this.logger.info('Memory MCP Server initialized', {
      persist: !!this.memoryConfig.persistPath,
      capabilities: this.config.capabilities.length,
    });
  }

  async start(): Promise<void> {
    this.logger.info('Starting Memory MCP Server...');

    await this.store.initialize();

    if (this.memoryConfig.cleanupIntervalMs) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpired();
      }, this.memoryConfig.cleanupIntervalMs);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line) as JsonRpcRequest;
        const response = await this.handleRequest(request);
        this.sendResponse(response);
      } catch (error) {
        this.logger.error('Failed to parse request', { error: (error as Error).message });
        const errorResponse = createErrorResponse(0, ErrorCode.ParseError, 'Invalid JSON');
        this.sendResponse(errorResponse);
      }
    });

    rl.on('close', () => {
      this.shutdown();
    });

    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    this.logger.info('Memory MCP Server started successfully');
  }

  private async cleanupExpired(): Promise<void> {
    try {
      this.logger.debug('Running expired entries cleanup');
      const now = Date.now();
      const allKeys = await this.store.keys();
      let deletedCount = 0;

      for (const key of allKeys) {
        const entry = await this.store.get(key);
        if (!entry || !entry.metadata || !entry.metadata.ttl) continue;

        const createdTime = new Date(entry.metadata.created).getTime();
        const expiryTime = createdTime + entry.metadata.ttl;

        if (now > expiryTime) {
          await this.store.delete(key);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        this.logger.info('Cleaned up expired entries', { deleted: deletedCount });
      }
    } catch (error) {
      this.logger.error('Cleanup failed', { error: (error as Error).message });
    }
  }

  private async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    this.requestCount++;

    const validation = validateJsonRpcRequest(request);
    if (!validation.valid) {
      this.errorCount++;
      return createErrorResponse(
        request.id || 0,
        ErrorCode.InvalidRequest,
        validation.error || 'Invalid request'
      );
    }

    const clientId = 'default';
    if (this.rateLimiter && this.rateLimiter.isRateLimited(clientId)) {
      this.errorCount++;
      return createErrorResponse(request.id, ErrorCode.RateLimitExceeded, 'Rate limit exceeded');
    }

    this.logger.debug('Handling request', {
      id: request.id,
      method: request.method,
    });

    try {
      const params = (request.params as Record<string, unknown>) || {};

      switch (request.method) {
        case 'memory.store':
          return await handleStore(request.id, params, this.store, this.logger);

        case 'memory.update':
          return await handleUpdate(request.id, params, this.store, this.logger);

        case 'memory.batchStore':
          return await handleBatchStore(request.id, params, this.store, this.logger);

        case 'memory.exists':
          return await handleExists(request.id, params, this.store, this.logger);

        case 'memory.retrieve':
          return await handleRetrieve(request.id, params, this.store, this.logger);

        case 'memory.retrieveMultiple':
          return await handleRetrieveMultiple(request.id, params, this.store, this.logger);

        case 'memory.list':
          return await handleList(request.id, params, this.store, this.logger);

        case 'memory.size':
          return await handleSize(request.id, this.store, this.logger);

        case 'memory.keys':
          return await handleKeys(request.id, params, this.store, this.logger);

        case 'memory.search':
          return await handleSearch(request.id, params, this.store, this.logger);

        case 'memory.searchByTag':
          return await handleSearchByTag(request.id, params, this.store, this.logger);

        case 'memory.searchByType':
          return await handleSearchByType(request.id, params, this.store, this.logger);

        case 'memory.getStats':
          return await handleGetStats(request.id, this.store, this.logger);

        case 'memory.delete':
          return await handleDelete(request.id, params, this.store, this.logger);

        case 'memory.deleteMultiple':
          return await handleDeleteMultiple(request.id, params, this.store, this.logger);

        case 'memory.deleteByPattern':
          return await handleDeleteByPattern(request.id, params, this.store, this.logger);

        case 'memory.deleteByTag':
          return await handleDeleteByTag(request.id, params, this.store, this.logger);

        case 'memory.clear':
          return await handleClear(request.id, params, this.store, this.logger);

        case 'memory.deleteExpired':
          return await handleDeleteExpired(request.id, this.store, this.logger);

        case 'memory.persist':
          return await this.handlePersist(request.id);

        case 'memory.backup':
          return await this.handleBackup(request.id, params);

        case 'memory.restore':
          return await this.handleRestore(request.id, params);

        case 'server.info':
          return this.handleServerInfo(request.id);

        case 'server.health':
          return this.handleHealthCheck(request.id);

        case 'server.capabilities':
          return this.handleCapabilities(request.id);

        default:
          this.errorCount++;
          return createErrorResponse(
            request.id,
            ErrorCode.MethodNotFound,
            `Method not found: ${request.method}`
          );
      }
    } catch (error) {
      this.errorCount++;
      this.logger.error('Error handling request', {
        id: request.id,
        method: request.method,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      return createErrorResponse(
        request.id,
        ErrorCode.InternalError,
        `Internal error: ${(error as Error).message}`
      );
    }
  }

  private async handlePersist(id: string | number): Promise<JsonRpcResponse> {
    try {
      this.logger.debug('Persisting memory');

      await this.store.persist();

      this.logger.info('Memory persisted successfully');

      return createSuccessResponse(id, {
        persisted: true,
        path: this.memoryConfig.persistPath,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to persist memory', { error: err.message });

      return createErrorResponse(
        id,
        ErrorCode.InternalError,
        `Failed to persist memory: ${err.message}`
      );
    }
  }

  private async handleBackup(
    id: string | number,
    params: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    const { path: backupPath } = params as { path: string };

    if (!backupPath) {
      return createErrorResponse(id, ErrorCode.InvalidParams, 'Backup path is required');
    }

    try {
      this.logger.debug('Creating backup', { path: backupPath });

      await this.store.backup(backupPath);

      this.logger.info('Backup created successfully', { path: backupPath });

      return createSuccessResponse(id, {
        backup: true,
        path: backupPath,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to create backup', { error: err.message });

      return createErrorResponse(
        id,
        ErrorCode.InternalError,
        `Failed to create backup: ${err.message}`
      );
    }
  }

  private async handleRestore(
    id: string | number,
    params: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    const { path: backupPath } = params as { path: string };

    if (!backupPath) {
      return createErrorResponse(id, ErrorCode.InvalidParams, 'Backup path is required');
    }

    try {
      this.logger.debug('Restoring from backup', { path: backupPath });

      await this.store.restore(backupPath);

      this.logger.info('Restored from backup successfully', { path: backupPath });

      return createSuccessResponse(id, {
        restored: true,
        path: backupPath,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to restore from backup', { error: err.message });

      return createErrorResponse(
        id,
        ErrorCode.InternalError,
        `Failed to restore from backup: ${err.message}`
      );
    }
  }

  private async handleServerInfo(id: string | number): Promise<JsonRpcResponse> {
    return createSuccessResponse(id, {
      ...this.config,
      persist: !!this.memoryConfig.persistPath,
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      storeSize: await this.store.size(),
    });
  }

  private async handleHealthCheck(id: string | number): Promise<JsonRpcResponse> {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    const storeSize = await this.store.size();

    const status = errorRate > 0.5 ? 'unhealthy' : errorRate > 0.2 ? 'degraded' : 'healthy';

    return createSuccessResponse(id, {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      version: this.config.version,
      checks: [
        {
          name: 'error_rate',
          status: errorRate > 0.5 ? 'fail' : 'pass',
          message: `Error rate: ${(errorRate * 100).toFixed(2)}%`,
        },
        {
          name: 'store_size',
          status: 'pass',
          message: `Store entries: ${storeSize}`,
        },
      ],
    });
  }

  private handleCapabilities(id: string | number): JsonRpcResponse {
    return createSuccessResponse(id, {
      capabilities: this.config.capabilities,
      transport: this.config.transport,
    });
  }

  private sendResponse(response: JsonRpcResponse): void {
    console.log(JSON.stringify(response));
  }

  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down Memory MCP Server...');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    await this.store.shutdown();

    this.logger.info('Memory MCP Server stopped', {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      uptime: Date.now() - this.startTime,
    });

    process.exit(0);
  }
}

const config: MemoryConfig = {
  persistPath: process.env.PERSIST_PATH,
  autoSaveMs: process.env.AUTO_SAVE_MS ? parseInt(process.env.AUTO_SAVE_MS, 10) : undefined,
  cleanupIntervalMs: process.env.CLEANUP_INTERVAL_MS
    ? parseInt(process.env.CLEANUP_INTERVAL_MS, 10)
    : undefined,
  rateLimit:
    process.env.RATE_LIMIT_ENABLED === 'true'
      ? {
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        }
      : undefined,
};

const server = new MemoryMCPServer(config);
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
