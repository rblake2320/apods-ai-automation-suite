import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import automationRoutes from './automation.routes';
import mcpRoutes from './mcp.routes';
import healthRoutes from './health.routes';

/**
 * Main router aggregator
 * Combines all route modules
 */
const router = Router();

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/automation', automationRoutes);
router.use('/mcp', mcpRoutes);
router.use('/health', healthRoutes);

/**
 * Root API endpoint
 * GET /api/v1
 */
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'APODS AI Automation Suite API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      projects: '/api/v1/projects',
      automation: '/api/v1/automation',
      mcp: '/api/v1/mcp',
      health: '/health',
      status: '/api/v1/health/status',
      info: '/api/v1/health/info',
    },
  });
});

export default router;
