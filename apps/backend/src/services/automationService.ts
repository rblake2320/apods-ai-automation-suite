import { AutomationTask } from '../models/AutomationTask';
import { db } from '../config/database';
import { ApiError } from '../utils/ApiError';
import {
  IAutomationTask,
  AutomationTaskType,
  AutomationTaskStatus,
  PaginationOptions,
  PaginatedResults,
  TaskExecutionResult,
} from '../types';
import logger from '../utils/logger';
import { PlaywrightService } from './playwrightService';
import { AIService } from './aiService';

/**
 * Automation Service
 * Handles automation task operations and execution
 */
export class AutomationService {
  /**
   * Creates a new automation task
   * @param userId - User ID
   * @param data - Task data
   * @returns Created task
   */
  static async create(
    userId: string,
    data: {
      projectId: string;
      name: string;
      description?: string;
      type: AutomationTaskType;
      script: string;
      schedule?: string;
      config?: Record<string, any>;
    }
  ): Promise<IAutomationTask> {
    // Verify project exists and user owns it
    const project = db.getProjectById(data.projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to create tasks in this project');
    }

    const task = AutomationTask.create({
      userId,
      ...data,
    });

    db.createAutomationTask(task);

    logger.info(`Automation task created: ${task.name} by user ${userId}`);

    return task.toJSON();
  }

  /**
   * Gets a task by ID
   * @param taskId - Task ID
   * @param userId - User ID (for authorization)
   * @returns Task
   */
  static async getById(taskId: string, userId: string): Promise<IAutomationTask> {
    const task = db.getAutomationTaskById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Check ownership
    if (task.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this task');
    }

    return task;
  }

  /**
   * Gets all tasks for a user with pagination
   * @param userId - User ID
   * @param options - Pagination options
   * @returns Paginated tasks
   */
  static async getAll(
    userId: string,
    options: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<PaginatedResults<IAutomationTask>> {
    const tasks = db.getAutomationTasksByUserId(userId);

    // Sort tasks
    const sorted = [...tasks].sort((a, b) => {
      const field = options.sortBy || 'createdAt';
      const order = options.sortOrder === 'asc' ? 1 : -1;

      const aValue = a[field as keyof IAutomationTask];
      const bValue = b[field as keyof IAutomationTask];

      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });

    // Paginate
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedTasks = sorted.slice(startIndex, endIndex);

    return {
      data: paginatedTasks,
      meta: {
        page: options.page,
        limit: options.limit,
        total: tasks.length,
        totalPages: Math.ceil(tasks.length / options.limit),
      },
    };
  }

  /**
   * Gets tasks by project ID
   * @param projectId - Project ID
   * @param userId - User ID (for authorization)
   * @returns Tasks
   */
  static async getByProjectId(projectId: string, userId: string): Promise<IAutomationTask[]> {
    // Verify project ownership
    const project = db.getProjectById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this project');
    }

    return db.getAutomationTasksByProjectId(projectId);
  }

  /**
   * Updates a task
   * @param taskId - Task ID
   * @param userId - User ID (for authorization)
   * @param updates - Task updates
   * @returns Updated task
   */
  static async update(
    taskId: string,
    userId: string,
    updates: Partial<IAutomationTask>
  ): Promise<IAutomationTask> {
    const task = db.getAutomationTaskById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Check ownership
    if (task.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this task');
    }

    // Prevent updating task if it's running
    if (task.status === AutomationTaskStatus.RUNNING) {
      throw ApiError.conflict('Cannot update a running task');
    }

    const taskInstance = new AutomationTask(task);
    taskInstance.update(updates);

    const updated = db.updateAutomationTask(taskId, taskInstance);

    if (!updated) {
      throw ApiError.internal('Failed to update task');
    }

    logger.info(`Task updated: ${taskId} by user ${userId}`);

    return updated;
  }

  /**
   * Deletes a task
   * @param taskId - Task ID
   * @param userId - User ID (for authorization)
   */
  static async delete(taskId: string, userId: string): Promise<void> {
    const task = db.getAutomationTaskById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Check ownership
    if (task.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this task');
    }

    // Prevent deleting a running task
    if (task.status === AutomationTaskStatus.RUNNING) {
      throw ApiError.conflict('Cannot delete a running task');
    }

    const deleted = db.deleteAutomationTask(taskId);

    if (!deleted) {
      throw ApiError.internal('Failed to delete task');
    }

    logger.info(`Task deleted: ${taskId} by user ${userId}`);
  }

  /**
   * Executes an automation task
   * @param taskId - Task ID
   * @param userId - User ID (for authorization)
   * @returns Execution result
   */
  static async execute(taskId: string, userId: string): Promise<TaskExecutionResult> {
    const task = db.getAutomationTaskById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Check ownership
    if (task.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to execute this task');
    }

    // Prevent executing a task that's already running
    if (task.status === AutomationTaskStatus.RUNNING) {
      throw ApiError.conflict('Task is already running');
    }

    const taskInstance = new AutomationTask(task);
    taskInstance.markAsRunning();
    db.updateAutomationTask(taskId, taskInstance);

    const startTime = new Date();
    const logs: string[] = [];

    try {
      logger.info(`Executing task: ${taskId}`);
      logs.push(`Task execution started at ${startTime.toISOString()}`);

      let result: any;

      // Execute task based on type
      switch (task.type) {
        case AutomationTaskType.WEB_AUTOMATION:
          result = await PlaywrightService.executeScript(task.script, task.config);
          break;

        case AutomationTaskType.API_TESTING:
          // Simple API testing execution
          result = await this.executeApiTest(task.script, task.config);
          break;

        case AutomationTaskType.DATA_EXTRACTION:
          result = await PlaywrightService.executeScript(task.script, task.config);
          break;

        case AutomationTaskType.CUSTOM:
          // For custom tasks, use AI to help execute
          result = await AIService.executeCustomTask(task.script, task.config);
          break;

        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      // Mark as completed
      taskInstance.markAsCompleted(result);
      db.updateAutomationTask(taskId, taskInstance);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logs.push(`Task execution completed at ${endTime.toISOString()}`);
      logs.push(`Duration: ${duration}ms`);

      logger.info(`Task completed: ${taskId}`);

      return {
        taskId,
        status: AutomationTaskStatus.COMPLETED,
        startedAt: startTime,
        completedAt: endTime,
        duration,
        output: result,
        logs,
      };
    } catch (error: any) {
      // Mark as failed
      taskInstance.markAsFailed(error.message);
      db.updateAutomationTask(taskId, taskInstance);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logs.push(`Task execution failed at ${endTime.toISOString()}`);
      logs.push(`Error: ${error.message}`);

      logger.error(`Task failed: ${taskId}`, error);

      return {
        taskId,
        status: AutomationTaskStatus.FAILED,
        startedAt: startTime,
        completedAt: endTime,
        duration,
        error: error.message,
        logs,
      };
    }
  }

  /**
   * Cancels a running task
   * @param taskId - Task ID
   * @param userId - User ID (for authorization)
   */
  static async cancel(taskId: string, userId: string): Promise<void> {
    const task = db.getAutomationTaskById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Check ownership
    if (task.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to cancel this task');
    }

    if (task.status !== AutomationTaskStatus.RUNNING) {
      throw ApiError.conflict('Only running tasks can be cancelled');
    }

    const taskInstance = new AutomationTask(task);
    taskInstance.markAsCancelled();
    db.updateAutomationTask(taskId, taskInstance);

    logger.info(`Task cancelled: ${taskId} by user ${userId}`);
  }

  /**
   * Executes an API test
   * @param script - Test script (URL and method)
   * @param config - Configuration
   * @returns Test result
   */
  private static async executeApiTest(script: string, config: Record<string, any>): Promise<any> {
    try {
      const { method = 'GET', headers = {}, body } = config;

      const response = await fetch(script, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        ...(body && { body: JSON.stringify(body) }),
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: await response.json().catch(() => response.text()),
      };
    } catch (error: any) {
      throw new Error(`API test failed: ${error.message}`);
    }
  }
}
