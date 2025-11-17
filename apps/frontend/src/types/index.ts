// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  type: 'node' | 'python' | 'java' | 'go' | 'rust' | 'other';
  repository?: string;
  branch?: string;
  status: 'active' | 'inactive' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  autoSave: boolean;
  formatOnSave: boolean;
  linting: boolean;
  testing: boolean;
  notifications: boolean;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: FileNode[];
  isExpanded?: boolean;
  modifiedAt?: string;
}

// ============================================================================
// Automation Types
// ============================================================================

export type AutomationStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

export type AutomationTriggerType = 'manual' | 'schedule' | 'webhook' | 'event';

export type AutomationActionType =
  | 'execute_command'
  | 'run_script'
  | 'api_call'
  | 'file_operation'
  | 'git_operation'
  | 'notification'
  | 'mcp_operation';

export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  projectId?: string;
  status: AutomationStatus;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  schedule?: AutomationSchedule;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface AutomationTrigger {
  type: AutomationTriggerType;
  config: Record<string, unknown>;
}

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  name: string;
  config: Record<string, unknown>;
  order: number;
  enabled: boolean;
  continueOnError: boolean;
  timeout?: number;
}

export interface AutomationSchedule {
  type: 'once' | 'recurring';
  cron?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface AutomationExecution {
  id: string;
  taskId: string;
  status: AutomationStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  logs: AutomationLog[];
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  actionId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MCP (Model Context Protocol) Server Types
// ============================================================================

export type MCPServerStatus = 'online' | 'offline' | 'error' | 'starting' | 'stopping';

export type MCPServerType = 'filesystem' | 'git' | 'database' | 'api' | 'custom';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  type: MCPServerType;
  status: MCPServerStatus;
  url: string;
  version: string;
  config: MCPServerConfig;
  capabilities: string[];
  healthCheck?: HealthCheck;
  metrics?: MCPServerMetrics;
  createdAt: string;
  updatedAt: string;
  lastPing?: string;
}

export interface MCPServerConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apikey';
    credentials?: Record<string, string>;
  };
  timeout?: number;
  retryAttempts?: number;
  customSettings?: Record<string, unknown>;
}

export interface HealthCheck {
  lastCheck: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  message?: string;
}

export interface MCPServerMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
  lastError?: string;
  lastErrorAt?: string;
}

export interface MCPTool {
  id: string;
  serverId: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  category?: string;
  tags: string[];
}

export interface MCPResource {
  id: string;
  serverId: string;
  uri: string;
  name: string;
  type: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface AppSettings {
  general: GeneralSettings;
  editor: EditorSettings;
  automation: AutomationSettings;
  notifications: NotificationSettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  lineNumbers: 'on' | 'off' | 'relative';
  minimap: boolean;
  formatOnSave: boolean;
  autoSave: 'off' | 'afterDelay' | 'onFocusChange';
  autoSaveDelay: number;
}

export interface AutomationSettings {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  retryFailedTasks: boolean;
  maxRetries: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface NotificationSettings {
  enabled: boolean;
  desktop: boolean;
  email: boolean;
  sound: boolean;
  taskCompletion: boolean;
  taskFailure: boolean;
  systemAlerts: boolean;
}

export interface AdvancedSettings {
  debugMode: boolean;
  telemetry: boolean;
  experimentalFeatures: boolean;
  apiCaching: boolean;
  cacheTimeout: number;
  maxCacheSize: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  totalCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: MenuItem[];
}

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'switch'
    | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  validation?: ValidationRule[];
  options?: SelectOption[];
  helperText?: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalProjects: number;
  activeAutomations: number;
  mcpServers: number;
  tasksToday: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface ActivityItem {
  id: string;
  type: 'automation' | 'project' | 'mcp' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  metadata?: Record<string, unknown>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// WebSocket Types
// ============================================================================

export type WebSocketEventType =
  | 'automation_started'
  | 'automation_completed'
  | 'automation_failed'
  | 'mcp_status_changed'
  | 'project_updated'
  | 'notification';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};
