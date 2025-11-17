/**
 * Shared TypeScript interfaces and types for the APODS backend
 */

/**
 * User role enumeration
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * User interface
 */
export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User response (without password)
 */
export type UserResponse = Omit<IUser, 'password'>;

/**
 * Project status enumeration
 */
export enum ProjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

/**
 * Project interface
 */
export interface IProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  repository?: string;
  status: ProjectStatus;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Automation task type enumeration
 */
export enum AutomationTaskType {
  WEB_AUTOMATION = 'web-automation',
  API_TESTING = 'api-testing',
  DATA_EXTRACTION = 'data-extraction',
  CUSTOM = 'custom',
}

/**
 * Automation task status enumeration
 */
export enum AutomationTaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Automation task interface
 */
export interface IAutomationTask {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  type: AutomationTaskType;
  script: string;
  schedule?: string;
  status: AutomationTaskStatus;
  config: Record<string, any>;
  lastRunAt?: Date;
  nextRunAt?: Date;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MCP Server status enumeration
 */
export enum MCPServerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

/**
 * MCP Server interface
 */
export interface IMCPServer {
  id: string;
  userId: string;
  name: string;
  description?: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  status: MCPServerStatus;
  lastHealthCheck?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response wrapper interface
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated results interface
 */
export interface PaginatedResults<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * JWT token payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authentication tokens interface
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data interface
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  TASK_STARTED = 'task:started',
  TASK_PROGRESS = 'task:progress',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  SERVER_STATUS = 'server:status',
  NOTIFICATION = 'notification',
}

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: Date;
}

/**
 * Task execution result interface
 */
export interface TaskExecutionResult {
  taskId: string;
  status: AutomationTaskStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  output?: any;
  error?: string;
  logs?: string[];
}

/**
 * Playwright browser options
 */
export interface PlaywrightOptions {
  headless?: boolean;
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
}

/**
 * AI prompt configuration
 */
export interface AIPromptConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * File upload information
 */
export interface FileUploadInfo {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  services: {
    database: boolean;
    mcp: boolean;
    ai: boolean;
  };
  version: string;
}

/**
 * Error log interface
 */
export interface ErrorLog {
  id: string;
  userId?: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  level: 'error' | 'warn' | 'info';
  createdAt: Date;
}

/**
 * Audit log interface
 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
