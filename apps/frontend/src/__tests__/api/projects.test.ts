import { describe, it, expect, vi } from 'vitest';
import * as projectsAPI from '@/api/projects';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Projects API', () => {
  it('should get projects', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.get as any).mockResolvedValue({ data: [] });

    const result = await projectsAPI.getProjects();
    expect(result.data).toEqual([]);
  });

  it('should get single project', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.get as any).mockResolvedValue({ data: { id: '1', name: 'Test' } });

    const result = await projectsAPI.getProject('1');
    expect(result.data.id).toBe('1');
  });

  it('should create project', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.post as any).mockResolvedValue({ data: { id: '1' } });

    const result = await projectsAPI.createProject({ name: 'New Project' });
    expect(result.data.id).toBe('1');
  });

  it('should update project', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.put as any).mockResolvedValue({ data: { updated: true } });

    const result = await projectsAPI.updateProject('1', { name: 'Updated' });
    expect(result.data.updated).toBe(true);
  });

  it('should delete project', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.delete as any).mockResolvedValue({ data: { deleted: true } });

    const result = await projectsAPI.deleteProject('1');
    expect(result.data.deleted).toBe(true);
  });

  it('should get file tree', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.get as any).mockResolvedValue({ data: [] });

    const result = await projectsAPI.getFileTree('1');
    expect(result.data).toEqual([]);
  });
});
