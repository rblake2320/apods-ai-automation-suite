import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validator';
import {
  createProjectSchema,
  updateProjectSchema,
  idParamSchema,
  paginationSchema,
  searchQuerySchema,
} from '../utils/validation';
import { apiLimiter } from '../middleware/rateLimiter';

/**
 * Project routes
 */
const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/projects/search
 * Search projects
 */
router.get('/search', validateQuery(searchQuerySchema), ProjectController.search);

/**
 * GET /api/v1/projects
 * Get all projects for current user
 */
router.get('/', validateQuery(paginationSchema), ProjectController.getAll);

/**
 * POST /api/v1/projects
 * Create a new project
 */
router.post('/', apiLimiter, validateBody(createProjectSchema), ProjectController.create);

/**
 * GET /api/v1/projects/:id
 * Get project by ID
 */
router.get('/:id', validateParams(idParamSchema), ProjectController.getById);

/**
 * PUT /api/v1/projects/:id
 * Update project
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateProjectSchema),
  ProjectController.update
);

/**
 * DELETE /api/v1/projects/:id
 * Delete project
 */
router.delete('/:id', validateParams(idParamSchema), ProjectController.delete);

/**
 * POST /api/v1/projects/:id/archive
 * Archive project
 */
router.post('/:id/archive', validateParams(idParamSchema), ProjectController.archive);

/**
 * POST /api/v1/projects/:id/activate
 * Activate project
 */
router.post('/:id/activate', validateParams(idParamSchema), ProjectController.activate);

export default router;
