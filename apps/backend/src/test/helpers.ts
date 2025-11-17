/**
 * Test helper functions
 * Provides utilities for testing
 */

import request from 'supertest';
import { Application } from 'express';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { AutomationTask } from '../models/AutomationTask';
import { MCPServer } from '../models/MCPServer';
import { db } from '../config/database';
import { JwtUtil } from '../utils/jwt';
import { UserRole, AutomationTaskType, ProjectStatus } from '../types';

/**
 * Creates a test user and returns the user with tokens
 */
export async function createTestUser(data?: {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}): Promise<{
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}> {
  const userData = {
    email: data?.email || 'test@example.com',
    password: data?.password || 'Test1234',
    name: data?.name || 'Test User',
    role: data?.role || UserRole.USER,
  };

  const user = await User.create(userData);
  db.createUser(user);

  const tokens = JwtUtil.generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, tokens };
}

/**
 * Creates a test admin user
 */
export async function createTestAdmin(): Promise<{
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}> {
  return createTestUser({ role: UserRole.ADMIN });
}

/**
 * Creates a test project
 */
export function createTestProject(userId: string, data?: Partial<Project>): Project {
  const project = Project.create({
    userId,
    name: data?.name || 'Test Project',
    description: data?.description || 'Test project description',
    repository: data?.repository,
    settings: data?.settings || {},
  });

  db.createProject(project);
  return project;
}

/**
 * Creates a test automation task
 */
export function createTestTask(
  userId: string,
  projectId: string,
  data?: Partial<AutomationTask>
): AutomationTask {
  const task = AutomationTask.create({
    userId,
    projectId,
    name: data?.name || 'Test Task',
    description: data?.description || 'Test task description',
    type: data?.type || AutomationTaskType.WEB_AUTOMATION,
    script: data?.script || 'console.log("test")',
    schedule: data?.schedule,
    config: data?.config || {},
  });

  db.createAutomationTask(task);
  return task;
}

/**
 * Creates a test MCP server
 */
export function createTestMCPServer(userId: string, data?: Partial<MCPServer>): MCPServer {
  const server = MCPServer.create({
    userId,
    name: data?.name || 'Test Server',
    description: data?.description || 'Test server description',
    command: data?.command || 'node',
    args: data?.args || ['server.js'],
    env: data?.env || {},
  });

  db.createMCPServer(server);
  return server;
}

/**
 * Makes an authenticated request
 */
export function authenticatedRequest(
  app: Application,
  token: string
): request.SuperTest<request.Test> {
  const agent = request(app);
  // Attach authorization header to all requests
  return {
    ...agent,
    get: (url: string) => agent.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => agent.post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => agent.put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => agent.patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => agent.delete(url).set('Authorization', `Bearer ${token}`),
  } as any;
}

/**
 * Waits for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a random email
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generates a random string
 */
export function randomString(length = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Cleans up test data
 */
export function cleanupTestData(): void {
  db.clear();
}

/**
 * Asserts that a response has a specific status code
 */
export function expectStatus(response: request.Response, status: number): void {
  expect(response.status).toBe(status);
}

/**
 * Asserts that a response is successful
 */
export function expectSuccess(response: request.Response): void {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  expect(response.body.status).toBe('success');
}

/**
 * Asserts that a response is an error
 */
export function expectError(response: request.Response, status?: number, message?: string): void {
  if (status) {
    expect(response.status).toBe(status);
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400);
  }
  expect(response.body.status).toBe('error');
  if (message) {
    expect(response.body.message).toContain(message);
  }
}

/**
 * Creates test data for a complete project setup
 */
export async function createTestProjectSetup(): Promise<{
  user: User;
  tokens: { accessToken: string; refreshToken: string };
  project: Project;
  task: AutomationTask;
  server: MCPServer;
}> {
  const { user, tokens } = await createTestUser();
  const project = createTestProject(user.id);
  const task = createTestTask(user.id, project.id);
  const server = createTestMCPServer(user.id);

  return { user, tokens, project, task, server };
}
