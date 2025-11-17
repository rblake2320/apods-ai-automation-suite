import { Router } from 'express';
import { MCPController } from '../controllers/mcpController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validator';
import { createMCPServerSchema, updateMCPServerSchema, idParamSchema } from '../utils/validation';
import { apiLimiter } from '../middleware/rateLimiter';

/**
 * MCP Server routes
 */
const router = Router();

// All MCP routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/mcp/servers
 * Get all MCP servers for current user
 */
router.get('/servers', MCPController.getAll);

/**
 * POST /api/v1/mcp/servers
 * Create a new MCP server configuration
 */
router.post('/servers', apiLimiter, validateBody(createMCPServerSchema), MCPController.create);

/**
 * GET /api/v1/mcp/servers/:id
 * Get MCP server by ID
 */
router.get('/servers/:id', validateParams(idParamSchema), MCPController.getById);

/**
 * PUT /api/v1/mcp/servers/:id
 * Update MCP server
 */
router.put(
  '/servers/:id',
  validateParams(idParamSchema),
  validateBody(updateMCPServerSchema),
  MCPController.update
);

/**
 * DELETE /api/v1/mcp/servers/:id
 * Delete MCP server
 */
router.delete('/servers/:id', validateParams(idParamSchema), MCPController.delete);

/**
 * POST /api/v1/mcp/servers/:id/start
 * Start MCP server
 */
router.post('/servers/:id/start', validateParams(idParamSchema), MCPController.start);

/**
 * POST /api/v1/mcp/servers/:id/stop
 * Stop MCP server
 */
router.post('/servers/:id/stop', validateParams(idParamSchema), MCPController.stop);

/**
 * POST /api/v1/mcp/servers/:id/restart
 * Restart MCP server
 */
router.post('/servers/:id/restart', validateParams(idParamSchema), MCPController.restart);

/**
 * GET /api/v1/mcp/servers/:id/status
 * Get MCP server status
 */
router.get('/servers/:id/status', validateParams(idParamSchema), MCPController.getStatus);

/**
 * GET /api/v1/mcp/servers/:id/health
 * Perform health check on MCP server
 */
router.get('/servers/:id/health', validateParams(idParamSchema), MCPController.healthCheck);

export default router;
