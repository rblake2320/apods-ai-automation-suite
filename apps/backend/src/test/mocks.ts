/**
 * Mock data and functions for testing
 */

import { IUser, IProject, IAutomationTask, IMCPServer, UserRole } from '../types';

/**
 * Mock user data
 */
export const mockUser: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
  email: 'mock@example.com',
  password: '$2b$10$mockhashedpassword',
  name: 'Mock User',
  role: UserRole.USER,
  isActive: true,
};

/**
 * Mock admin user data
 */
export const mockAdmin: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
  email: 'admin@example.com',
  password: '$2b$10$mockhashedpassword',
  name: 'Mock Admin',
  role: UserRole.ADMIN,
  isActive: true,
};

/**
 * Mock project data
 */
export const mockProject: Omit<IProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Mock Project',
  description: 'A mock project for testing',
  repository: 'https://github.com/example/repo',
  status: 'active' as any,
  settings: {
    autoRun: false,
    notifications: true,
  },
};

/**
 * Mock automation task data
 */
export const mockTask: Omit<
  IAutomationTask,
  'id' | 'userId' | 'projectId' | 'createdAt' | 'updatedAt'
> = {
  name: 'Mock Task',
  description: 'A mock automation task for testing',
  type: 'web-automation' as any,
  script: 'console.log("Hello from mock task")',
  schedule: '0 0 * * *',
  status: 'pending' as any,
  config: {
    timeout: 30000,
    retries: 3,
  },
};

/**
 * Mock MCP server data
 */
export const mockMCPServer: Omit<IMCPServer, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Mock Server',
  description: 'A mock MCP server for testing',
  command: 'node',
  args: ['server.js'],
  env: {
    NODE_ENV: 'test',
  },
  status: 'inactive' as any,
  lastHealthCheck: undefined,
};

/**
 * Mock JWT payload
 */
export const mockJwtPayload = {
  userId: 'mock-user-id',
  email: 'mock@example.com',
  role: UserRole.USER,
};

/**
 * Mock authentication tokens
 */
export const mockTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
};

/**
 * Mock API response
 */
export const mockApiResponse = {
  status: 'success',
  message: 'Operation successful',
  data: {},
};

/**
 * Mock API error response
 */
export const mockApiErrorResponse = {
  status: 'error',
  statusCode: 400,
  message: 'Bad request',
};

/**
 * Mock request object
 */
export const mockRequest = (overrides?: any) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: undefined,
  ...overrides,
});

/**
 * Mock response object
 */
export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock next function for middleware
 */
export const mockNext = jest.fn();

/**
 * Mock Anthropic AI response
 */
export const mockAnthropicResponse = {
  id: 'msg_mock123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'This is a mock response from Claude',
    },
  ],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 10,
    output_tokens: 20,
  },
};

/**
 * Mock Playwright page
 */
export const mockPlaywrightPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  content: jest.fn().mockResolvedValue('<html><body>Mock content</body></html>'),
  textContent: jest.fn().mockResolvedValue('Mock text content'),
  title: jest.fn().mockResolvedValue('Mock Page Title'),
  url: jest.fn().mockReturnValue('https://example.com'),
  screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
  close: jest.fn().mockResolvedValue(undefined),
  evaluate: jest.fn().mockResolvedValue(undefined),
  fill: jest.fn().mockResolvedValue(undefined),
  click: jest.fn().mockResolvedValue(undefined),
  waitForSelector: jest.fn().mockResolvedValue(undefined),
  setDefaultTimeout: jest.fn(),
  $$: jest.fn().mockResolvedValue([]),
};

/**
 * Mock Playwright browser context
 */
export const mockPlaywrightContext = {
  newPage: jest.fn().mockResolvedValue(mockPlaywrightPage),
  close: jest.fn().mockResolvedValue(undefined),
};

/**
 * Mock Playwright browser
 */
export const mockPlaywrightBrowser = {
  newContext: jest.fn().mockResolvedValue(mockPlaywrightContext),
  close: jest.fn().mockResolvedValue(undefined),
  isConnected: jest.fn().mockReturnValue(true),
};

/**
 * Mock WebSocket
 */
export const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  readyState: 1, // OPEN
};

/**
 * Mock child process
 */
export const mockChildProcess = {
  pid: 12345,
  kill: jest.fn(),
  killed: false,
  on: jest.fn(),
  stdout: {
    on: jest.fn(),
  },
  stderr: {
    on: jest.fn(),
  },
  stdin: {
    write: jest.fn(),
  },
};

/**
 * Creates mock data for testing
 */
export function createMockData<T>(overrides?: Partial<T>): T {
  return {
    ...overrides,
  } as T;
}

/**
 * Spy on console methods
 */
export function spyOnConsole() {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
  };
}

/**
 * Restore console spies
 */
export function restoreConsole(spies: ReturnType<typeof spyOnConsole>) {
  Object.values(spies).forEach((spy) => spy.mockRestore());
}
