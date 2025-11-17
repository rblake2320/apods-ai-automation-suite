import { describe, it, expect, vi } from 'vitest';
import * as automationAPI from '@/api/automation';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Automation API', () => {
  it('should get automation tasks', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.get as any).mockResolvedValue({ data: [] });

    const result = await automationAPI.getAutomationTasks();
    expect(result.data).toEqual([]);
  });

  it('should execute task', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.post as any).mockResolvedValue({ data: { success: true } });

    const result = await automationAPI.executeTask('task-1');
    expect(result.data.success).toBe(true);
  });

  it('should stop task', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.post as any).mockResolvedValue({ data: { stopped: true } });

    const result = await automationAPI.stopTask('task-1');
    expect(result.data.stopped).toBe(true);
  });

  it('should enable task', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.put as any).mockResolvedValue({ data: { enabled: true } });

    const result = await automationAPI.enableTask('task-1');
    expect(result.data.enabled).toBe(true);
  });

  it('should disable task', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.put as any).mockResolvedValue({ data: { enabled: false } });

    const result = await automationAPI.disableTask('task-1');
    expect(result.data.enabled).toBe(false);
  });

  it('should delete task', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.delete as any).mockResolvedValue({ data: { deleted: true } });

    const result = await automationAPI.deleteTask('task-1');
    expect(result.data.deleted).toBe(true);
  });
});
