/**
 * Database configuration and in-memory storage
 * This provides an in-memory database for development
 * Can be extended to support MongoDB, PostgreSQL, etc.
 */

import { IUser, IProject, IAutomationTask, IMCPServer } from '../types';
import logger from '../utils/logger';

/**
 * In-memory database storage
 */
class InMemoryDatabase {
  private users: Map<string, IUser> = new Map();
  private projects: Map<string, IProject> = new Map();
  private automationTasks: Map<string, IAutomationTask> = new Map();
  private mcpServers: Map<string, IMCPServer> = new Map();

  /**
   * Initialize the database
   */
  async connect(): Promise<void> {
    logger.info('In-memory database initialized');
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    this.users.clear();
    this.projects.clear();
    this.automationTasks.clear();
    this.mcpServers.clear();
    logger.info('In-memory database cleared');
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return true;
  }

  /**
   * Get all users
   */
  getUsers(): IUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): IUser | undefined {
    return this.users.get(id);
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): IUser | undefined {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  /**
   * Create a new user
   */
  createUser(user: IUser): IUser {
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Update a user
   */
  updateUser(id: string, updates: Partial<IUser>): IUser | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  /**
   * Get all projects
   */
  getProjects(): IProject[] {
    return Array.from(this.projects.values());
  }

  /**
   * Get projects by user ID
   */
  getProjectsByUserId(userId: string): IProject[] {
    return Array.from(this.projects.values()).filter((project) => project.userId === userId);
  }

  /**
   * Get project by ID
   */
  getProjectById(id: string): IProject | undefined {
    return this.projects.get(id);
  }

  /**
   * Create a new project
   */
  createProject(project: IProject): IProject {
    this.projects.set(project.id, project);
    return project;
  }

  /**
   * Update a project
   */
  updateProject(id: string, updates: Partial<IProject>): IProject | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  /**
   * Delete a project
   */
  deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  /**
   * Get all automation tasks
   */
  getAutomationTasks(): IAutomationTask[] {
    return Array.from(this.automationTasks.values());
  }

  /**
   * Get automation tasks by project ID
   */
  getAutomationTasksByProjectId(projectId: string): IAutomationTask[] {
    return Array.from(this.automationTasks.values()).filter((task) => task.projectId === projectId);
  }

  /**
   * Get automation tasks by user ID
   */
  getAutomationTasksByUserId(userId: string): IAutomationTask[] {
    return Array.from(this.automationTasks.values()).filter((task) => task.userId === userId);
  }

  /**
   * Get automation task by ID
   */
  getAutomationTaskById(id: string): IAutomationTask | undefined {
    return this.automationTasks.get(id);
  }

  /**
   * Create a new automation task
   */
  createAutomationTask(task: IAutomationTask): IAutomationTask {
    this.automationTasks.set(task.id, task);
    return task;
  }

  /**
   * Update an automation task
   */
  updateAutomationTask(id: string, updates: Partial<IAutomationTask>): IAutomationTask | undefined {
    const task = this.automationTasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    this.automationTasks.set(id, updatedTask);
    return updatedTask;
  }

  /**
   * Delete an automation task
   */
  deleteAutomationTask(id: string): boolean {
    return this.automationTasks.delete(id);
  }

  /**
   * Get all MCP servers
   */
  getMCPServers(): IMCPServer[] {
    return Array.from(this.mcpServers.values());
  }

  /**
   * Get MCP servers by user ID
   */
  getMCPServersByUserId(userId: string): IMCPServer[] {
    return Array.from(this.mcpServers.values()).filter((server) => server.userId === userId);
  }

  /**
   * Get MCP server by ID
   */
  getMCPServerById(id: string): IMCPServer | undefined {
    return this.mcpServers.get(id);
  }

  /**
   * Create a new MCP server
   */
  createMCPServer(server: IMCPServer): IMCPServer {
    this.mcpServers.set(server.id, server);
    return server;
  }

  /**
   * Update an MCP server
   */
  updateMCPServer(id: string, updates: Partial<IMCPServer>): IMCPServer | undefined {
    const server = this.mcpServers.get(id);
    if (!server) return undefined;

    const updatedServer = { ...server, ...updates, updatedAt: new Date() };
    this.mcpServers.set(id, updatedServer);
    return updatedServer;
  }

  /**
   * Delete an MCP server
   */
  deleteMCPServer(id: string): boolean {
    return this.mcpServers.delete(id);
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.users.clear();
    this.projects.clear();
    this.automationTasks.clear();
    this.mcpServers.clear();
  }
}

/**
 * Database instance
 */
export const db = new InMemoryDatabase();

/**
 * Initialize database connection
 */
export async function connectDatabase(): Promise<void> {
  try {
    await db.connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await db.disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database:', error);
    throw error;
  }
}
