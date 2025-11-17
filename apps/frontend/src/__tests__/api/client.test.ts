import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/client';

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should make GET requests', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const result = await apiClient.get('/test');
    expect(result.data).toBe('test');
  });

  it('should make POST requests', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1' }),
    });

    const result = await apiClient.post('/test', { name: 'Test' });
    expect(result.id).toBe('1');
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(apiClient.get('/test')).rejects.toThrow();
  });

  it('should add auth headers when token exists', async () => {
    localStorage.setItem('auth-token', 'test-token');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    await apiClient.get('/protected');

    const calls = (global.fetch as any).mock.calls;
    const headers = calls[0][1].headers;
    expect(headers.Authorization).toContain('test-token');
  });
});
