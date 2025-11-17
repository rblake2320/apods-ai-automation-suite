import { describe, it, expect, vi } from 'vitest';
import * as mcpAPI from '@/api/mcp';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MCP API', () => {
  it('should get MCP servers', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.get as any).mockResolvedValue({ data: [] });

    const result = await mcpAPI.getMCPServers();
    expect(result.data).toEqual([]);
  });

  it('should start MCP server', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.post as any).mockResolvedValue({ data: { status: 'online' } });

    const result = await mcpAPI.startMCPServer('server-1');
    expect(result.data.status).toBe('online');
  });

  it('should stop MCP server', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.post as any).mockResolvedValue({ data: { status: 'offline' } });

    const result = await mcpAPI.stopMCPServer('server-1');
    expect(result.data.status).toBe('offline');
  });

  it('should restart MCP server', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.post as any).mockResolvedValue({ data: { restarted: true } });

    const result = await mcpAPI.restartMCPServer('server-1');
    expect(result.data.restarted).toBe(true);
  });

  it('should delete MCP server', async () => {
    const { apiClient } = await import('@/api/client');
    (apiClient.delete as any).mockResolvedValue({ data: { deleted: true } });

    const result = await mcpAPI.deleteMCPServer('server-1');
    expect(result.data.deleted).toBe(true);
  });
});
