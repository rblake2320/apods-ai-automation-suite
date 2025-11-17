/**
 * Playwright MCP Server
 * Provides browser automation through Model Context Protocol
 */

import * as readline from 'readline';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import {
  handleNavigate,
  handleGoBack,
  handleGoForward,
  handleReload,
  handleGetUrl,
} from './handlers/navigate.js';
import {
  handleClick,
  handleFill,
  handleType,
  handlePress,
  handleCheck,
  handleUncheck,
  handleSelect,
} from './handlers/click.js';
import {
  handleScreenshot,
  handleElementScreenshot,
  handlePdf,
  handleViewport,
} from './handlers/screenshot.js';
import {
  handleExtract,
  handleEvaluate,
  handleWaitForSelector,
  handleWaitForTimeout,
  handleGetAttribute,
  handleIsVisible,
} from './handlers/extract.js';
import { handleRunAutomation, handleGetCookies, handleSetCookies } from './handlers/automation.js';
import {
  validateJsonRpcRequest,
  createErrorResponse,
  createSuccessResponse,
  RateLimiter,
} from '../../shared/utils.js';
import { ErrorCode, JsonRpcRequest, JsonRpcResponse, MCPServerConfig } from '../../shared/types.js';
import { createLogger, Logger } from '../../shared/logger.js';

interface PlaywrightConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  recordVideo?: boolean;
  recordVideoDir?: string;
  slowMo?: number;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

class PlaywrightMCPServer {
  private logger: Logger;
  private config: MCPServerConfig;
  private pwConfig: PlaywrightConfig;
  private rateLimiter?: RateLimiter;
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  constructor(config: PlaywrightConfig) {
    this.startTime = Date.now();
    this.pwConfig = {
      headless: config.headless !== false,
      viewport: config.viewport || { width: 1280, height: 720 },
      userAgent: config.userAgent,
      recordVideo: config.recordVideo || false,
      recordVideoDir: config.recordVideoDir || './videos',
      slowMo: config.slowMo || 0,
    };

    this.logger = createLogger({
      level: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
      serverName: 'playwright-mcp',
      logToFile: process.env.LOG_TO_FILE === 'true',
      logDir: process.env.LOG_DIR || './logs',
    });

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit.maxRequests, config.rateLimit.windowMs);
    }

    this.config = {
      name: 'playwright',
      version: '1.0.0',
      description: 'Browser automation MCP server',
      capabilities: [
        'browser.navigate',
        'browser.goBack',
        'browser.goForward',
        'browser.reload',
        'browser.getUrl',
        'browser.click',
        'browser.fill',
        'browser.type',
        'browser.press',
        'browser.check',
        'browser.uncheck',
        'browser.select',
        'browser.screenshot',
        'browser.elementScreenshot',
        'browser.pdf',
        'browser.viewport',
        'browser.extract',
        'browser.evaluate',
        'browser.waitForSelector',
        'browser.waitForTimeout',
        'browser.getAttribute',
        'browser.isVisible',
        'browser.runAutomation',
        'browser.getCookies',
        'browser.setCookies',
      ],
      transport: 'stdio',
    };

    this.logger.info('Playwright MCP Server initialized', {
      headless: this.pwConfig.headless,
      capabilities: this.config.capabilities.length,
    });
  }

  async start(): Promise<void> {
    this.logger.info('Starting Playwright MCP Server...');

    await this.initializeBrowser();

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

    this.logger.info('Playwright MCP Server started successfully');
  }

  private async initializeBrowser(): Promise<void> {
    try {
      this.logger.info('Initializing browser', { headless: this.pwConfig.headless });

      this.browser = await chromium.launch({
        headless: this.pwConfig.headless,
        slowMo: this.pwConfig.slowMo,
      });

      const contextOptions: Record<string, unknown> = {
        viewport: this.pwConfig.viewport,
      };

      if (this.pwConfig.userAgent) {
        contextOptions.userAgent = this.pwConfig.userAgent;
      }

      if (this.pwConfig.recordVideo) {
        contextOptions.recordVideo = {
          dir: this.pwConfig.recordVideoDir,
        };
      }

      this.context = await this.browser.newContext(contextOptions);
      this.page = await this.context.newPage();

      this.logger.info('Browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser', {
        error: (error as Error).message,
      });
      throw error;
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

    if (!this.page || !this.browser) {
      this.errorCount++;
      return createErrorResponse(request.id, ErrorCode.InternalError, 'Browser not initialized');
    }

    try {
      const params = (request.params as Record<string, unknown>) || {};

      switch (request.method) {
        case 'browser.navigate':
          return await handleNavigate(request.id, params, this.page, this.logger);

        case 'browser.goBack':
          return await handleGoBack(request.id, params, this.page, this.logger);

        case 'browser.goForward':
          return await handleGoForward(request.id, params, this.page, this.logger);

        case 'browser.reload':
          return await handleReload(request.id, params, this.page, this.logger);

        case 'browser.getUrl':
          return await handleGetUrl(request.id, this.page, this.logger);

        case 'browser.click':
          return await handleClick(request.id, params, this.page, this.logger);

        case 'browser.fill':
          return await handleFill(request.id, params, this.page, this.logger);

        case 'browser.type':
          return await handleType(request.id, params, this.page, this.logger);

        case 'browser.press':
          return await handlePress(request.id, params, this.page, this.logger);

        case 'browser.check':
          return await handleCheck(request.id, params, this.page, this.logger);

        case 'browser.uncheck':
          return await handleUncheck(request.id, params, this.page, this.logger);

        case 'browser.select':
          return await handleSelect(request.id, params, this.page, this.logger);

        case 'browser.screenshot':
          return await handleScreenshot(request.id, params, this.page, this.logger);

        case 'browser.elementScreenshot':
          return await handleElementScreenshot(request.id, params, this.page, this.logger);

        case 'browser.pdf':
          return await handlePdf(request.id, params, this.page, this.logger);

        case 'browser.viewport':
          return await handleViewport(request.id, params, this.page, this.logger);

        case 'browser.extract':
          return await handleExtract(request.id, params, this.page, this.logger);

        case 'browser.evaluate':
          return await handleEvaluate(request.id, params, this.page, this.logger);

        case 'browser.waitForSelector':
          return await handleWaitForSelector(request.id, params, this.page, this.logger);

        case 'browser.waitForTimeout':
          return await handleWaitForTimeout(request.id, params, this.page, this.logger);

        case 'browser.getAttribute':
          return await handleGetAttribute(request.id, params, this.page, this.logger);

        case 'browser.isVisible':
          return await handleIsVisible(request.id, params, this.page, this.logger);

        case 'browser.runAutomation':
          return await handleRunAutomation(
            request.id,
            params,
            this.page,
            this.browser,
            this.logger
          );

        case 'browser.getCookies':
          return await handleGetCookies(request.id, params, this.page, this.logger);

        case 'browser.setCookies':
          return await handleSetCookies(request.id, params, this.page, this.logger);

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
      browserConfig: this.pwConfig,
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      browserConnected: !!this.browser?.isConnected(),
    });
  }

  private handleHealthCheck(id: string | number): JsonRpcResponse {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    const browserConnected = this.browser?.isConnected() || false;

    const status =
      !browserConnected || errorRate > 0.5 ? 'unhealthy' : errorRate > 0.2 ? 'degraded' : 'healthy';

    return createSuccessResponse(id, {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      version: this.config.version,
      checks: [
        {
          name: 'browser_connection',
          status: browserConnected ? 'pass' : 'fail',
          message: browserConnected ? 'Browser connected' : 'Browser not connected',
        },
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

  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down Playwright MCP Server...');

    try {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      this.logger.error('Error during shutdown', {
        error: (error as Error).message,
      });
    }

    this.logger.info('Playwright MCP Server stopped', {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      uptime: Date.now() - this.startTime,
    });

    process.exit(0);
  }
}

const config: PlaywrightConfig = {
  headless: process.env.HEADLESS !== 'false',
  viewport:
    process.env.VIEWPORT_WIDTH && process.env.VIEWPORT_HEIGHT
      ? {
          width: parseInt(process.env.VIEWPORT_WIDTH, 10),
          height: parseInt(process.env.VIEWPORT_HEIGHT, 10),
        }
      : undefined,
  userAgent: process.env.USER_AGENT,
  recordVideo: process.env.RECORD_VIDEO === 'true',
  recordVideoDir: process.env.RECORD_VIDEO_DIR,
  slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : undefined,
  rateLimit:
    process.env.RATE_LIMIT_ENABLED === 'true'
      ? {
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50', 10),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        }
      : undefined,
};

const server = new PlaywrightMCPServer(config);
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
