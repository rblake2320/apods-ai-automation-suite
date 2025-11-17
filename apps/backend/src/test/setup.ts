/**
 * Jest test setup file
 * Configures the testing environment
 */

import { db } from '../config/database';
import { PlaywrightService } from '../services/playwrightService';
import { WebSocketService } from '../services/websocketService';

/**
 * Setup before all tests
 */
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce logging noise in tests

  // Initialize database
  await db.connect();
});

/**
 * Setup before each test
 */
beforeEach(async () => {
  // Clear database before each test
  db.clear();
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  // Clear any test data
  db.clear();
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  // Close Playwright browser
  await PlaywrightService.closeBrowser();

  // Close WebSocket connections
  WebSocketService.close();

  // Disconnect database
  await db.disconnect();
});

/**
 * Global test timeout
 */
jest.setTimeout(30000); // 30 seconds

/**
 * Mock console methods to reduce noise in tests
 */
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

/**
 * Mock timers utility
 */
export const mockTimers = () => {
  jest.useFakeTimers();
  return {
    advance: (ms: number) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    runPending: () => jest.runOnlyPendingTimers(),
    restore: () => jest.useRealTimers(),
  };
};
