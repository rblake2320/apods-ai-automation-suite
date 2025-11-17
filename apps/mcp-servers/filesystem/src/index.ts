/**
 * Filesystem MCP Server
 * Provides file system operations through Model Context Protocol
 */

import * as readline from 'readline';
import { handleReadFile } from './handlers/readFile.js';
import { handleWriteFile, handleDeleteFile } from './handlers/writeFile.js';
import { handleListDirectory, handleCreateDirectory } from './handlers/listDirectory.js';
import { handleSearch, handleFindFiles } from './handlers/search.js';
import {
  handleWatchStart,
  handleWatchStop,
  handleWatchList,
  stopAllWatchers,
} from './handlers/watch.js';
import {
  validateJsonRpcRequest,
  createErrorResponse,
  createSuccessResponse,
  RateLimiter,
} from '../../shared/utils.js';
import {
  ErrorCode,
  JsonRpcRequest,
  JsonRpcResponse,
  MCPServerConfig,
  FileWatchEvent,
} from '../../shared/types.js';
import { createLogger, Logger } from '../../shared/logger.js';

interface FilesystemConfig {
  allowedDirectories: string[];
  maxFileSize?: number;
  enableWatch?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

class FilesystemMCPServer {
  private logger: Logger;
  private config: MCPServerConfig;
  private fsConfig: FilesystemConfig;
  private rateLimiter?: RateLimiter;
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;

  constructor(config: FilesystemConfig) {
    this.startTime = Date.now();
    this.fsConfig = {
      ...config,
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB default
      enableWatch: config.enableWatch !== false,
    };

    this.logger = createLogger({
      level: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
      serverName: 'filesystem-mcp',
      logToFile: process.env.LOG_TO_FILE === 'true',
      logDir: process.env.LOG_DIR || './logs',
    });

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit.maxRequests, config.rateLimit.windowMs);
    }

    this.config = {
      name: 'filesystem',
      version: '1.0.0',
      description: 'Filesystem operations MCP server',
      capabilities: [
        'fs.read',
        'fs.write',
        'fs.delete',
        'fs.list',
        'fs.createDirectory',
        'fs.search',
        'fs.findFiles',
        'fs.watch.start',
        'fs.watch.stop',
        'fs.watch.list',
      ],
      transport: 'stdio',
    };

    this.logger.info('Filesystem MCP Server initialized', {
      allowedDirectories: this.fsConfig.allowedDirectories,
      capabilities: this.config.capabilities,
    });
  }

  async start(): Promise<void> {
    this.logger.info('Starting Filesystem MCP Server...');

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

    this.logger.info('Filesystem MCP Server started successfully');
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
        case 'fs.read':
          return await handleReadFile(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger
          );

        case 'fs.write':
          return await handleWriteFile(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger
          );

        case 'fs.delete':
          return await handleDeleteFile(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger
          );

        case 'fs.list':
          return await handleListDirectory(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger
          );

        case 'fs.createDirectory':
          return await handleCreateDirectory(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger
          );

        case 'fs.search':
          return await handleSearch(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger
          );

        case 'fs.findFiles':
          return await handleFindFiles(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger
          );

        case 'fs.watch.start':
          if (!this.fsConfig.enableWatch) {
            return createErrorResponse(
              request.id,
              ErrorCode.MethodNotFound,
              'File watching is disabled'
            );
          }
          return await handleWatchStart(
            request.id,
            params,
            this.fsConfig.allowedDirectories,
            this.logger,
            this.sendWatchEvent.bind(this)
          );

        case 'fs.watch.stop':
          if (!this.fsConfig.enableWatch) {
            return createErrorResponse(
              request.id,
              ErrorCode.MethodNotFound,
              'File watching is disabled'
            );
          }
          return await handleWatchStop(request.id, params, this.logger);

        case 'fs.watch.list':
          if (!this.fsConfig.enableWatch) {
            return createErrorResponse(
              request.id,
              ErrorCode.MethodNotFound,
              'File watching is disabled'
            );
          }
          return await handleWatchList(request.id, this.logger);

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

  private handleServerInfo(id: string | number): JsonRpcResponse {
    return createSuccessResponse(id, {
      ...this.config,
      allowedDirectories: this.fsConfig.allowedDirectories,
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
    });
  }

  private handleHealthCheck(id: string | number): JsonRpcResponse {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;

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

  private sendWatchEvent(watchId: string, event: FileWatchEvent): void {
    const notification = {
      jsonrpc: '2.0',
      method: 'fs.watch.event',
      params: {
        watchId,
        event,
      },
    };
    console.log(JSON.stringify(notification));
  }

  private shutdown(): void {
    this.logger.info('Shutting down Filesystem MCP Server...');

    if (this.fsConfig.enableWatch) {
      stopAllWatchers(this.logger);
    }

    this.logger.info('Filesystem MCP Server stopped', {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      uptime: Date.now() - this.startTime,
    });

    process.exit(0);
  }
}

const config: FilesystemConfig = {
  allowedDirectories: process.env.ALLOWED_DIRECTORIES
    ? process.env.ALLOWED_DIRECTORIES.split(',')
    : ['./apps/frontend', './apps/backend', './scripts'],
  maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE, 10) : undefined,
  enableWatch: process.env.ENABLE_WATCH !== 'false',
  rateLimit:
    process.env.RATE_LIMIT_ENABLED === 'true'
      ? {
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        }
      : undefined,
};

const server = new FilesystemMCPServer(config);
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
