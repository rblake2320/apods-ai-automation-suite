import { IAutomationTask, AutomationTaskType, AutomationTaskStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * AutomationTask Model
 * Represents an automation task in the system
 */
export class AutomationTask implements IAutomationTask {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  type: AutomationTaskType;
  script: string;
  schedule?: string;
  status: AutomationTaskStatus;
  config: Record<string, any>;
  lastRunAt?: Date;
  nextRunAt?: Date;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IAutomationTask>) {
    this.id = data.id || uuidv4();
    this.projectId = data.projectId!;
    this.userId = data.userId!;
    this.name = data.name!;
    this.description = data.description;
    this.type = data.type!;
    this.script = data.script!;
    this.schedule = data.schedule;
    this.status = data.status || AutomationTaskStatus.PENDING;
    this.config = data.config || {};
    this.lastRunAt = data.lastRunAt;
    this.nextRunAt = data.nextRunAt;
    this.result = data.result;
    this.error = data.error;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Creates a new automation task
   * @param data - Task data
   * @returns New AutomationTask instance
   */
  static create(data: {
    projectId: string;
    userId: string;
    name: string;
    description?: string;
    type: AutomationTaskType;
    script: string;
    schedule?: string;
    config?: Record<string, any>;
  }): AutomationTask {
    return new AutomationTask(data);
  }

  /**
   * Updates task data
   * @param updates - Partial task data to update
   */
  update(updates: Partial<IAutomationTask>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }

  /**
   * Marks the task as running
   */
  markAsRunning(): void {
    this.status = AutomationTaskStatus.RUNNING;
    this.lastRunAt = new Date();
    this.error = undefined;
    this.updatedAt = new Date();
  }

  /**
   * Marks the task as completed
   * @param result - Task execution result
   */
  markAsCompleted(result?: any): void {
    this.status = AutomationTaskStatus.COMPLETED;
    this.result = result;
    this.error = undefined;
    this.updatedAt = new Date();
  }

  /**
   * Marks the task as failed
   * @param error - Error message
   */
  markAsFailed(error: string): void {
    this.status = AutomationTaskStatus.FAILED;
    this.error = error;
    this.updatedAt = new Date();
  }

  /**
   * Marks the task as cancelled
   */
  markAsCancelled(): void {
    this.status = AutomationTaskStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Resets the task to pending state
   */
  reset(): void {
    this.status = AutomationTaskStatus.PENDING;
    this.result = undefined;
    this.error = undefined;
    this.updatedAt = new Date();
  }

  /**
   * Checks if task is pending
   * @returns True if task is pending, false otherwise
   */
  isPending(): boolean {
    return this.status === AutomationTaskStatus.PENDING;
  }

  /**
   * Checks if task is running
   * @returns True if task is running, false otherwise
   */
  isRunning(): boolean {
    return this.status === AutomationTaskStatus.RUNNING;
  }

  /**
   * Checks if task is completed
   * @returns True if task is completed, false otherwise
   */
  isCompleted(): boolean {
    return this.status === AutomationTaskStatus.COMPLETED;
  }

  /**
   * Checks if task has failed
   * @returns True if task has failed, false otherwise
   */
  hasFailed(): boolean {
    return this.status === AutomationTaskStatus.FAILED;
  }

  /**
   * Checks if task is cancelled
   * @returns True if task is cancelled, false otherwise
   */
  isCancelled(): boolean {
    return this.status === AutomationTaskStatus.CANCELLED;
  }

  /**
   * Gets a config value
   * @param key - Config key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Config value or default value
   */
  getConfig<T = any>(key: string, defaultValue?: T): T {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  /**
   * Sets a config value
   * @param key - Config key
   * @param value - Config value
   */
  setConfig(key: string, value: any): void {
    this.config[key] = value;
    this.updatedAt = new Date();
  }

  /**
   * Calculates the duration of the last run
   * @returns Duration in milliseconds or undefined
   */
  getLastRunDuration(): number | undefined {
    if (!this.lastRunAt) return undefined;
    const endTime = this.isRunning() ? new Date() : this.updatedAt;
    return endTime.getTime() - this.lastRunAt.getTime();
  }

  /**
   * Converts task to JSON
   * @returns Task data as plain object
   */
  toJSON(): IAutomationTask {
    return {
      id: this.id,
      projectId: this.projectId,
      userId: this.userId,
      name: this.name,
      description: this.description,
      type: this.type,
      script: this.script,
      schedule: this.schedule,
      status: this.status,
      config: this.config,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
