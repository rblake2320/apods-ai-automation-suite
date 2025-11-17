import { IMCPServer, MCPServerStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * MCPServer Model
 * Represents an MCP (Model Context Protocol) server configuration
 */
export class MCPServer implements IMCPServer {
  id: string;
  userId: string;
  name: string;
  description?: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  status: MCPServerStatus;
  lastHealthCheck?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IMCPServer>) {
    this.id = data.id || uuidv4();
    this.userId = data.userId!;
    this.name = data.name!;
    this.description = data.description;
    this.command = data.command!;
    this.args = data.args;
    this.env = data.env;
    this.status = data.status || MCPServerStatus.INACTIVE;
    this.lastHealthCheck = data.lastHealthCheck;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Creates a new MCP server configuration
   * @param data - Server data
   * @returns New MCPServer instance
   */
  static create(data: {
    userId: string;
    name: string;
    description?: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }): MCPServer {
    return new MCPServer(data);
  }

  /**
   * Updates server data
   * @param updates - Partial server data to update
   */
  update(updates: Partial<IMCPServer>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }

  /**
   * Marks the server as active
   */
  markAsActive(): void {
    this.status = MCPServerStatus.ACTIVE;
    this.lastHealthCheck = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Marks the server as inactive
   */
  markAsInactive(): void {
    this.status = MCPServerStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Marks the server as having an error
   */
  markAsError(): void {
    this.status = MCPServerStatus.ERROR;
    this.lastHealthCheck = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Checks if server is active
   * @returns True if server is active, false otherwise
   */
  isActive(): boolean {
    return this.status === MCPServerStatus.ACTIVE;
  }

  /**
   * Checks if server is inactive
   * @returns True if server is inactive, false otherwise
   */
  isInactive(): boolean {
    return this.status === MCPServerStatus.INACTIVE;
  }

  /**
   * Checks if server has an error
   * @returns True if server has an error, false otherwise
   */
  hasError(): boolean {
    return this.status === MCPServerStatus.ERROR;
  }

  /**
   * Updates the last health check timestamp
   */
  updateHealthCheck(): void {
    this.lastHealthCheck = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Gets the command with arguments as a string
   * @returns Full command string
   */
  getFullCommand(): string {
    const args = this.args?.join(' ') || '';
    return `${this.command} ${args}`.trim();
  }

  /**
   * Gets an environment variable
   * @param key - Environment variable key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Environment variable value or default value
   */
  getEnv(key: string, defaultValue?: string): string | undefined {
    return this.env?.[key] || defaultValue;
  }

  /**
   * Sets an environment variable
   * @param key - Environment variable key
   * @param value - Environment variable value
   */
  setEnv(key: string, value: string): void {
    if (!this.env) {
      this.env = {};
    }
    this.env[key] = value;
    this.updatedAt = new Date();
  }

  /**
   * Removes an environment variable
   * @param key - Environment variable key
   */
  removeEnv(key: string): void {
    if (this.env) {
      delete this.env[key];
      this.updatedAt = new Date();
    }
  }

  /**
   * Checks if the server has been health checked recently
   * @param thresholdMinutes - Threshold in minutes (default: 5)
   * @returns True if health check is recent, false otherwise
   */
  hasRecentHealthCheck(thresholdMinutes = 5): boolean {
    if (!this.lastHealthCheck) return false;
    const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds
    const now = new Date().getTime();
    const lastCheck = this.lastHealthCheck.getTime();
    return now - lastCheck < threshold;
  }

  /**
   * Converts server to JSON
   * @returns Server data as plain object
   */
  toJSON(): IMCPServer {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      description: this.description,
      command: this.command,
      args: this.args,
      env: this.env,
      status: this.status,
      lastHealthCheck: this.lastHealthCheck,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
