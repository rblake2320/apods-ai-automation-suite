import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validation target (where to validate data from)
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * Creates middleware to validate request data using Zod schemas
 *
 * @param schema - Zod schema to validate against
 * @param target - Where to get the data from (body, query, or params)
 * @returns Express middleware function
 *
 * @example
 * router.post('/users', validate(createUserSchema, 'body'), userController.create);
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get data from the specified target
      const data = req[target];

      // Validate and parse the data
      const validated = schema.parse(data);

      // Replace the original data with validated data
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a more readable structure
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        next(ApiError.validationError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates request body
 * @param schema - Zod schema to validate against
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Validates request query parameters
 * @param schema - Zod schema to validate against
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

/**
 * Validates request URL parameters
 * @param schema - Zod schema to validate against
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Sanitizes input by removing potentially dangerous characters
 * This is a basic sanitizer and should be enhanced based on specific needs
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize body, query, and params
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};
