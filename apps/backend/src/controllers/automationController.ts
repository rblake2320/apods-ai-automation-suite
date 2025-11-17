import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AutomationService } from '../services/automationService';
import { WebSocketService } from '../services/websocketService';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * Automation Controller
 * Handles HTTP requests for automation task management
 */
export class AutomationController {
  /**
   * Create a new automation task
   * POST /api/v1/automation/tasks
   */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { projectId, name, description, type, script, schedule, config } = req.body;

    const task = await AutomationService.create(userId, {
      projectId,
      name,
      description,
      type,
      script,
      schedule,
      config,
    });

    logger.info(`Automation task created: ${task.id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Automation task created successfully',
      data: task,
    };

    res.status(201).json(response);
  });

  /**
   * Get all automation tasks for current user
   * GET /api/v1/automation/tasks
   */
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc' } = req.query;

    const result = await AutomationService.getAll(userId, {
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
   * Get automation task by ID
   * GET /api/v1/automation/tasks/:id
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const task = await AutomationService.getById(id, userId);

    const response: ApiResponse = {
      status: 'success',
      data: task,
    };

    res.status(200).json(response);
  });

  /**
   * Get automation tasks by project ID
   * GET /api/v1/automation/tasks/project/:projectId
   */
  static getByProjectId = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { projectId } = req.params;

    const tasks = await AutomationService.getByProjectId(projectId, userId);

    const response: ApiResponse = {
      status: 'success',
      data: tasks,
    };

    res.status(200).json(response);
  });

  /**
   * Update automation task
   * PUT /api/v1/automation/tasks/:id
   */
  static update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const task = await AutomationService.update(id, userId, updates);

    logger.info(`Automation task updated: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Automation task updated successfully',
      data: task,
    };

    res.status(200).json(response);
  });

  /**
   * Delete automation task
   * DELETE /api/v1/automation/tasks/:id
   */
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await AutomationService.delete(id, userId);

    logger.info(`Automation task deleted: ${id} by user ${userId}`);

    const response: ApiResponse = {
      status: 'success',
      message: 'Automation task deleted successfully',
    };

    res.status(200).json(response);
  });

  /**
   * Execute automation task
   * POST /api/v1/automation/tasks/:id/execute
   */
  static execute = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    logger.info(`Executing automation task: ${id}`);

    // Send WebSocket notification that task started
    WebSocketService.notifyTaskStatus(userId, id, 'started');

    // Execute task asynchronously
    AutomationService.execute(id, userId)
      .then((result) => {
        // Send WebSocket notification on completion
        WebSocketService.notifyTaskStatus(userId, id, 'completed', result);
      })
      .catch((error) => {
        // Send WebSocket notification on failure
        WebSocketService.notifyTaskStatus(userId, id, 'failed', {
          error: error.message,
        });
      });

    const response: ApiResponse = {
      status: 'success',
      message: 'Task execution started',
      data: { taskId: id, status: 'running' },
    };

    res.status(202).json(response);
  });

  /**
   * Cancel running automation task
   * POST /api/v1/automation/tasks/:id/cancel
   */
  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await AutomationService.cancel(id, userId);

    logger.info(`Automation task cancelled: ${id} by user ${userId}`);

    // Send WebSocket notification
    WebSocketService.sendNotification(userId, `Task ${id} has been cancelled`, 'info');

    const response: ApiResponse = {
      status: 'success',
      message: 'Task cancelled successfully',
    };

    res.status(200).json(response);
  });
}
