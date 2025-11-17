import { z } from 'zod';

/**
 * Common validation schemas using Zod
 */

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Password validation schema
 * Requires at least 8 characters, one uppercase, one lowercase, one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * MongoDB ObjectId validation schema
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

/**
 * URL validation schema
 */
export const urlSchema = z.string().url('Invalid URL format');

/**
 * Date validation schema (ISO 8601 format)
 */
export const dateSchema = z.string().datetime('Invalid date format');

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).default('user').optional(),
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Project creation schema
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  repository: urlSchema.optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * Project update schema
 */
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  repository: urlSchema.optional(),
  settings: z.record(z.any()).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

/**
 * Automation task creation schema
 */
export const createAutomationTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Task name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['web-automation', 'api-testing', 'data-extraction', 'custom']),
  script: z.string().min(1, 'Script is required'),
  schedule: z.string().optional(),
  config: z.record(z.any()).optional(),
});

/**
 * Automation task update schema
 */
export const updateAutomationTaskSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['web-automation', 'api-testing', 'data-extraction', 'custom']).optional(),
  script: z.string().optional(),
  schedule: z.string().optional(),
  config: z.record(z.any()).optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
});

/**
 * MCP server creation schema
 */
export const createMCPServerSchema = z.object({
  name: z.string().min(1, 'Server name is required').max(100),
  description: z.string().max(500).optional(),
  command: z.string().min(1, 'Command is required'),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

/**
 * MCP server update schema
 */
export const updateMCPServerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
});

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  ...paginationSchema.shape,
});

/**
 * Helper function to validate data against a schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and parsed data
 * @throws ZodError if validation fails
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Helper function to safely validate data against a schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success status and data or error
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
