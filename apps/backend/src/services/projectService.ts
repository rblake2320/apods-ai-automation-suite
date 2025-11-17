import { Project } from '../models/Project';
import { db } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { IProject, PaginationOptions, PaginatedResults } from '../types';
import logger from '../utils/logger';

/**
 * Project Service
 * Handles project CRUD operations
 */
export class ProjectService {
  /**
   * Creates a new project
   * @param userId - User ID
   * @param data - Project data
   * @returns Created project
   */
  static async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      repository?: string;
      settings?: Record<string, any>;
    }
  ): Promise<IProject> {
    const project = Project.create({
      userId,
      ...data,
    });

    db.createProject(project);

    logger.info(`Project created: ${project.name} by user ${userId}`);

    return project.toJSON();
  }

  /**
   * Gets a project by ID
   * @param projectId - Project ID
   * @param userId - User ID (for authorization)
   * @returns Project
   */
  static async getById(projectId: string, userId: string): Promise<IProject> {
    const project = db.getProjectById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check ownership
    if (project.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this project');
    }

    return project;
  }

  /**
   * Gets all projects for a user with pagination
   * @param userId - User ID
   * @param options - Pagination options
   * @returns Paginated projects
   */
  static async getAll(
    userId: string,
    options: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<PaginatedResults<IProject>> {
    const projects = db.getProjectsByUserId(userId);

    // Sort projects
    const sorted = [...projects].sort((a, b) => {
      const field = options.sortBy || 'createdAt';
      const order = options.sortOrder === 'asc' ? 1 : -1;

      const aValue = a[field as keyof IProject];
      const bValue = b[field as keyof IProject];

      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });

    // Paginate
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedProjects = sorted.slice(startIndex, endIndex);

    return {
      data: paginatedProjects,
      meta: {
        page: options.page,
        limit: options.limit,
        total: projects.length,
        totalPages: Math.ceil(projects.length / options.limit),
      },
    };
  }

  /**
   * Updates a project
   * @param projectId - Project ID
   * @param userId - User ID (for authorization)
   * @param updates - Project updates
   * @returns Updated project
   */
  static async update(
    projectId: string,
    userId: string,
    updates: Partial<IProject>
  ): Promise<IProject> {
    const project = db.getProjectById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check ownership
    if (project.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this project');
    }

    // Create Project instance and update
    const projectInstance = new Project(project);
    projectInstance.update(updates);

    // Save to database
    const updated = db.updateProject(projectId, projectInstance);

    if (!updated) {
      throw ApiError.internal('Failed to update project');
    }

    logger.info(`Project updated: ${projectId} by user ${userId}`);

    return updated;
  }

  /**
   * Deletes a project
   * @param projectId - Project ID
   * @param userId - User ID (for authorization)
   */
  static async delete(projectId: string, userId: string): Promise<void> {
    const project = db.getProjectById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check ownership
    if (project.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this project');
    }

    // Delete associated automation tasks
    const tasks = db.getAutomationTasksByProjectId(projectId);
    tasks.forEach((task) => db.deleteAutomationTask(task.id));

    // Delete project
    const deleted = db.deleteProject(projectId);

    if (!deleted) {
      throw ApiError.internal('Failed to delete project');
    }

    logger.info(`Project deleted: ${projectId} by user ${userId}`);
  }

  /**
   * Archives a project
   * @param projectId - Project ID
   * @param userId - User ID (for authorization)
   * @returns Updated project
   */
  static async archive(projectId: string, userId: string): Promise<IProject> {
    const project = db.getProjectById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check ownership
    if (project.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to archive this project');
    }

    const projectInstance = new Project(project);
    projectInstance.archive();

    const updated = db.updateProject(projectId, projectInstance);

    if (!updated) {
      throw ApiError.internal('Failed to archive project');
    }

    logger.info(`Project archived: ${projectId} by user ${userId}`);

    return updated;
  }

  /**
   * Activates a project
   * @param projectId - Project ID
   * @param userId - User ID (for authorization)
   * @returns Updated project
   */
  static async activate(projectId: string, userId: string): Promise<IProject> {
    const project = db.getProjectById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check ownership
    if (project.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to activate this project');
    }

    const projectInstance = new Project(project);
    projectInstance.activate();

    const updated = db.updateProject(projectId, projectInstance);

    if (!updated) {
      throw ApiError.internal('Failed to activate project');
    }

    logger.info(`Project activated: ${projectId} by user ${userId}`);

    return updated;
  }

  /**
   * Searches projects by name
   * @param userId - User ID
   * @param query - Search query
   * @returns Matching projects
   */
  static async search(userId: string, query: string): Promise<IProject[]> {
    const projects = db.getProjectsByUserId(userId);

    const searchQuery = query.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery) ||
        project.description?.toLowerCase().includes(searchQuery)
    );

    return filtered;
  }
}
