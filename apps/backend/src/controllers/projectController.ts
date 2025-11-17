import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ProjectService } from '../services/projectService';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * Project Controller
 * Handles HTTP requests for project management
 */
export class ProjectController {
  /**
   * Create a new project
   * POST /api/v1/projects
   */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { name, description, repository, settings } = req.body;

    const project = await ProjectService.create(userId, {
      name,
      description,
      repository,
      settings,
    });

    logger.info(`Project created: ${project.id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Project created successfully',
      data: project,
    };

    res.status(201).json(response);
  });

  /**
   * Get all projects for current user
   * GET /api/v1/projects
   */
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc' } = req.query;

    const result = await ProjectService.getAll(userId, {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    const response: ApiResponse = {
      status: 'success',
      data: result.data,
      meta: result.meta,
    };

    res.status(200).json(response);
  });

  /**
   * Get project by ID
   * GET /api/v1/projects/:id
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await ProjectService.getById(id, userId);

    const response: ApiResponse = {
      status: 'success',
      data: project,
    };

    res.status(200).json(response);
  });

  /**
   * Update project
   * PUT /api/v1/projects/:id
   */
  static update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const project = await ProjectService.update(id, userId, updates);

    logger.info(`Project updated: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Project updated successfully',
      data: project,
    };

    res.status(200).json(response);
  });

  /**
   * Delete project
   * DELETE /api/v1/projects/:id
   */
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await ProjectService.delete(id, userId);

    logger.info(`Project deleted: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Project deleted successfully',
    };

    res.status(200).json(response);
  });

  /**
   * Archive project
   * POST /api/v1/projects/:id/archive
   */
  static archive = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await ProjectService.archive(id, userId);

    logger.info(`Project archived: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Project archived successfully',
      data: project,
    };

    res.status(200).json(response);
  });

  /**
   * Activate project
   * POST /api/v1/projects/:id/activate
   */
  static activate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await ProjectService.activate(id, userId);

    logger.info(`Project activated: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Project activated successfully',
      data: project,
    };

    res.status(200).json(response);
  });

  /**
   * Search projects
   * GET /api/v1/projects/search
   */
  static search = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { q } = req.query;

    const projects = await ProjectService.search(userId, q as string);

    const response: ApiResponse = {
      status: 'success',
      data: projects,
    };

    res.status(200).json(response);
  });
}
