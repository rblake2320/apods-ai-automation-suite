import { Router } from 'express';
import { AutomationController } from '../controllers/automationController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validator';
import {
  createAutomationTaskSchema,
  updateAutomationTaskSchema,
  idParamSchema,
  paginationSchema,
} from '../utils/validation';
import { automationLimiter, apiLimiter } from '../middleware/rateLimiter';

/**
 * Automation task routes
 */
const router = Router();

// All automation routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/automation/tasks
 * Get all automation tasks for current user
 */
router.get('/tasks', validateQuery(paginationSchema), AutomationController.getAll);

/**
 * POST /api/v1/automation/tasks
 * Create a new automation task
 */
router.post(
  '/tasks',
  apiLimiter,
  validateBody(createAutomationTaskSchema),
  AutomationController.create
);

/**
 * GET /api/v1/automation/tasks/project/:projectId
 * Get automation tasks by project ID
 */
router.get(
  '/tasks/project/:projectId',
  validateParams(idParamSchema.extend({ projectId: idParamSchema.shape.id })),
  AutomationController.getByProjectId
);

/**
 * GET /api/v1/automation/tasks/:id
 * Get automation task by ID
 */
router.get('/tasks/:id', validateParams(idParamSchema), AutomationController.getById);

/**
 * PUT /api/v1/automation/tasks/:id
 * Update automation task
 */
router.put(
  '/tasks/:id',
  validateParams(idParamSchema),
  validateBody(updateAutomationTaskSchema),
  AutomationController.update
);

/**
 * DELETE /api/v1/automation/tasks/:id
 * Delete automation task
 */
router.delete('/tasks/:id', validateParams(idParamSchema), AutomationController.delete);

/**
 * POST /api/v1/automation/tasks/:id/execute
 * Execute automation task
 */
router.post(
  '/tasks/:id/execute',
  automationLimiter,
  validateParams(idParamSchema),
  AutomationController.execute
);

/**
 * POST /api/v1/automation/tasks/:id/cancel
 * Cancel running automation task
 */
router.post('/tasks/:id/cancel', validateParams(idParamSchema), AutomationController.cancel);

export default router;
