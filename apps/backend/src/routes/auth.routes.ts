import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation';
import { authLimiter } from '../middleware/rateLimiter';

/**
 * Authentication routes
 */
const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', validateBody(refreshTokenSchema), AuthController.refreshToken);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 * Requires authentication
 */
router.get('/me', authenticate, AuthController.getProfile);

/**
 * POST /api/v1/auth/change-password
 * Change user password
 * Requires authentication
 */
router.post('/change-password', authenticate, AuthController.changePassword);

/**
 * POST /api/v1/auth/logout
 * Logout user
 * Requires authentication
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * GET /api/v1/auth/validate
 * Validate JWT token
 */
router.get('/validate', AuthController.validateToken);

export default router;
