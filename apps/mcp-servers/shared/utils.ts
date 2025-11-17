/**
 * Shared Utility Functions for MCP Servers
 */

import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  ErrorCode,
  MCPContext,
  ValidationRule,
} from './types.js';

/**
 * Create a JSON-RPC success response
 */
export function createSuccessResponse(id: string | number, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Create a JSON-RPC error response
 */
export function createErrorResponse(
  id: string | number,
  code: ErrorCode,
  message: string,
  data?: unknown
): JsonRpcResponse {
  const error: JsonRpcError = {
    code,
    message,
  };

  if (data !== undefined) {
    error.data = data;
  }

  return {
    jsonrpc: '2.0',
    id,
    error,
  };
}

/**
 * Validate JSON-RPC request
 */
export function validateJsonRpcRequest(request: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof request !== 'object' || request === null) {
    return { valid: false, error: 'Request must be an object' };
  }

  const req = request as Record<string, unknown>;

  if (req.jsonrpc !== '2.0') {
    return { valid: false, error: 'Invalid JSON-RPC version' };
  }

  if (typeof req.id !== 'string' && typeof req.id !== 'number') {
    return { valid: false, error: 'Invalid request ID' };
  }

  if (typeof req.method !== 'string') {
    return { valid: false, error: 'Invalid method' };
  }

  return { valid: true };
}

/**
 * Validate request parameters against schema
 */
export function validateParams(
  params: Record<string, unknown>,
  schema: Array<{ name: string; type: string; required: boolean; validation?: ValidationRule[] }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of schema) {
    const value = params[field.name];

    if (field.required && value === undefined) {
      errors.push(`Missing required parameter: ${field.name}`);
      continue;
    }

    if (value !== undefined) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== field.type && field.type !== 'any') {
        errors.push(`Invalid type for ${field.name}: expected ${field.type}, got ${actualType}`);
      }

      if (field.validation) {
        for (const rule of field.validation) {
          const validationError = validateRule(value, rule, field.name);
          if (validationError) {
            errors.push(validationError);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single validation rule
 */
function validateRule(value: unknown, rule: ValidationRule, fieldName: string): string | null {
  switch (rule.type) {
    case 'min':
      if (typeof value === 'number' && value < (rule.value as number)) {
        return rule.message || `${fieldName} must be at least ${rule.value}`;
      }
      if (typeof value === 'string' && value.length < (rule.value as number)) {
        return rule.message || `${fieldName} must be at least ${rule.value} characters`;
      }
      break;

    case 'max':
      if (typeof value === 'number' && value > (rule.value as number)) {
        return rule.message || `${fieldName} must be at most ${rule.value}`;
      }
      if (typeof value === 'string' && value.length > (rule.value as number)) {
        return rule.message || `${fieldName} must be at most ${rule.value} characters`;
      }
      break;

    case 'pattern':
      if (typeof value === 'string') {
        const pattern = new RegExp(rule.value as string);
        if (!pattern.test(value)) {
          return rule.message || `${fieldName} does not match required pattern`;
        }
      }
      break;

    case 'enum':
      if (!Array.isArray(rule.value) || !rule.value.includes(value)) {
        return (
          rule.message || `${fieldName} must be one of: ${(rule.value as unknown[]).join(', ')}`
        );
      }
      break;
  }

  return null;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Create an MCP context object
 */
export function createContext(requestId?: string): MCPContext {
  return {
    requestId: requestId || generateRequestId(),
    timestamp: Date.now(),
  };
}

/**
 * Sanitize and validate file paths
 */
export function sanitizePath(
  inputPath: string,
  allowedDirectories: string[]
): { valid: boolean; sanitized?: string; error?: string } {
  try {
    const normalized = path.normalize(inputPath);
    const resolved = path.resolve(normalized);

    if (normalized.includes('..')) {
      return { valid: false, error: 'Path traversal detected' };
    }

    const isAllowed = allowedDirectories.some((dir) => {
      const allowedPath = path.resolve(dir);
      return resolved.startsWith(allowedPath);
    });

    if (!isAllowed) {
      return { valid: false, error: 'Path is outside allowed directories' };
    }

    return { valid: true, sanitized: resolved };
  } catch (error) {
    return { valid: false, error: `Invalid path: ${(error as Error).message}` };
  }
}

/**
 * Check if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file MIME type based on extension
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];

    const validRequests = clientRequests.filter((timestamp) => now - timestamp < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return true;
    }

    validRequests.push(now);
    this.requests.set(clientId, validRequests);

    return false;
  }

  reset(clientId: string): void {
    this.requests.delete(clientId);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [clientId, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter((timestamp) => now - timestamp < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, validRequests);
      }
    }
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  backoff: 'linear' | 'exponential' = 'exponential'
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts - 1) {
        const delay =
          backoff === 'exponential' ? baseDelay * Math.pow(2, attempt) : baseDelay * (attempt + 1);

        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  const match = duration.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * units[unit];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Safe JSON parse with default value
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Measure async function execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Create a timeout promise
 */
export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}
