import { Router } from 'express';
import { HealthController } from '../controllers/healthController';
import { authenticate } from '../middleware/auth';

/**
 * Health check and status routes
 */
const router = Router();

/**
 * GET /health
 * Basic health check (no authentication required)
 */
router.get('/', HealthController.healthCheck);

/**
 * GET /ready
 * Readiness probe (no authentication required)
 */
router.get('/ready', HealthController.ready);

/**
 * GET /alive
 * Liveness probe (no authentication required)
 */
router.get('/alive', HealthController.alive);

/**
 * GET /api/v1/status
 * Detailed status information (requires authentication)
 */
router.get('/status', authenticate, HealthController.status);

/**
 * GET /api/v1/info
 * API information (no authentication required)
 */
router.get('/info', HealthController.info);

export default router;
