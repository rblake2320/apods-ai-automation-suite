/**
 * Shared MCP Type Definitions
 * Based on JSON-RPC 2.0 and Model Context Protocol specifications
 */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000,
  RateLimitExceeded = -32001,
  Unauthorized = -32002,
  Forbidden = -32003,
  NotFound = -32004,
  ValidationError = -32005,
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  transport: 'stdio' | 'websocket' | 'http';
  port?: number;
  host?: string;
  maxConnections?: number;
  timeout?: number;
  rateLimit?: RateLimitConfig;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface MCPMethod {
  name: string;
  description: string;
  params?: MCPParameter[];
  returns?: MCPReturnType;
  examples?: MCPExample[];
}

export interface MCPParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value: unknown;
  message?: string;
}

export interface MCPReturnType {
  type: string;
  description: string;
  schema?: Record<string, unknown>;
}

export interface MCPExample {
  description: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  duration?: number;
}

export interface MCPContext {
  requestId: string;
  timestamp: number;
  clientInfo?: ClientInfo;
  metadata?: Record<string, unknown>;
}

export interface ClientInfo {
  id: string;
  version?: string;
  userAgent?: string;
}

export interface FileSystemOperation {
  path: string;
  content?: string;
  encoding?: 'utf8' | 'base64' | 'binary';
  options?: FileSystemOptions;
}

export interface FileSystemOptions {
  recursive?: boolean;
  overwrite?: boolean;
  createDirectory?: boolean;
  mode?: number;
  flag?: string;
}

export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  created: string;
  modified: string;
  accessed: string;
  permissions?: string;
  mimeType?: string;
}

export interface SearchOptions {
  pattern: string;
  caseSensitive?: boolean;
  regex?: boolean;
  maxResults?: number;
  includeHidden?: boolean;
  fileTypes?: string[];
}

export interface SearchResult {
  path: string;
  line?: number;
  column?: number;
  match: string;
  context?: string;
}

export interface WatchOptions {
  recursive?: boolean;
  events?: ('add' | 'change' | 'unlink')[];
  ignored?: string[];
  persistent?: boolean;
}

export interface FileWatchEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: string;
}

export interface PlaywrightOperation {
  action: string;
  params: Record<string, unknown>;
  timeout?: number;
  waitFor?: WaitForOptions;
}

export interface WaitForOptions {
  selector?: string;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  timeout?: number;
}

export interface NavigationOptions {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
  referer?: string;
}

export interface ClickOptions {
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  force?: boolean;
  timeout?: number;
}

export interface ScreenshotOptions {
  path?: string;
  type?: 'png' | 'jpeg';
  quality?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractOptions {
  selector?: string;
  attribute?: string;
  multiple?: boolean;
  format?: 'text' | 'html' | 'json';
}

export interface AutomationScript {
  name: string;
  steps: AutomationStep[];
  config?: AutomationConfig;
}

export interface AutomationStep {
  action: string;
  params: Record<string, unknown>;
  condition?: string;
  retry?: RetryConfig;
}

export interface AutomationConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  timeout?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
}

export interface MemoryEntry {
  key: string;
  value: unknown;
  metadata?: MemoryMetadata;
}

export interface MemoryMetadata {
  type?: string;
  tags?: string[];
  created: string;
  updated: string;
  accessed: string;
  ttl?: number;
  priority?: number;
}

export interface MemoryQuery {
  key?: string;
  pattern?: string;
  tags?: string[];
  type?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created' | 'updated' | 'accessed' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface MemoryStats {
  totalEntries: number;
  totalSize: number;
  byType: Record<string, number>;
  byTag: Record<string, number>;
  oldestEntry?: string;
  newestEntry?: string;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export interface Metric {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
}
