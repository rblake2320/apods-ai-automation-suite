import { Request, Response, NextFunction } from 'express';

/**
 * Type definition for async route handlers
 */
type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps async route handlers to catch errors and pass them to the error middleware
 * This eliminates the need for try-catch blocks in every async route handler
 *
 * @param fn - The async function to wrap
 * @returns Express middleware function
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Alternative async handler that can be used as a decorator (future TypeScript feature)
 */
export const catchAsync = asyncHandler;
