import { IProject, ProjectStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Project Model
 * Represents a project in the APODS system
 */
export class Project implements IProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  repository?: string;
  status: ProjectStatus;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IProject>) {
    this.id = data.id || uuidv4();
    this.userId = data.userId!;
    this.name = data.name!;
    this.description = data.description;
    this.repository = data.repository;
    this.status = data.status || ProjectStatus.ACTIVE;
    this.settings = data.settings || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Creates a new project
   * @param data - Project data
   * @returns New Project instance
   */
  static create(data: {
    userId: string;
    name: string;
    description?: string;
    repository?: string;
    settings?: Record<string, any>;
  }): Project {
    return new Project(data);
  }

  /**
   * Updates project data
   * @param updates - Partial project data to update
   */
  update(updates: Partial<IProject>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }

  /**
   * Archives the project
   */
  archive(): void {
    this.status = ProjectStatus.ARCHIVED;
    this.updatedAt = new Date();
  }

  /**
   * Activates the project
   */
  activate(): void {
    this.status = ProjectStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Deactivates the project
   */
  deactivate(): void {
    this.status = ProjectStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Checks if project is active
   * @returns True if project is active, false otherwise
   */
  isActive(): boolean {
    return this.status === ProjectStatus.ACTIVE;
  }

  /**
   * Checks if project is archived
   * @returns True if project is archived, false otherwise
   */
  isArchived(): boolean {
    return this.status === ProjectStatus.ARCHIVED;
  }

  /**
   * Gets a setting value
   * @param key - Setting key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Setting value or default value
   */
  getSetting<T = any>(key: string, defaultValue?: T): T {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  /**
   * Sets a setting value
   * @param key - Setting key
   * @param value - Setting value
   */
  setSetting(key: string, value: any): void {
    this.settings[key] = value;
    this.updatedAt = new Date();
  }

  /**
   * Removes a setting
   * @param key - Setting key
   */
  removeSetting(key: string): void {
    delete this.settings[key];
    this.updatedAt = new Date();
  }

  /**
   * Converts project to JSON
   * @returns Project data as plain object
   */
  toJSON(): IProject {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      description: this.description,
      repository: this.repository,
      status: this.status,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
