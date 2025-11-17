import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutomationStore } from '@/store/useAutomationStore';

// Mock API
vi.mock('@/api/automation', () => ({
  getAutomationTasks: vi.fn().mockResolvedValue({ data: [] }),
  executeTask: vi.fn(),
  stopTask: vi.fn(),
  enableTask: vi.fn(),
  disableTask: vi.fn(),
  deleteTask: vi.fn(),
}));

describe('useAutomationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty tasks array', () => {
      const { result } = renderHook(() => useAutomationStore());
      expect(result.current.tasks).toEqual([]);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useAutomationStore());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Fetch Tasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockTasks = [
        { id: '1', name: 'Task 1', status: 'idle', enabled: true },
        { id: '2', name: 'Task 2', status: 'running', enabled: true },
      ];

      const { getAutomationTasks } = await import('@/api/automation');
      (getAutomationTasks as any).mockResolvedValue({ data: mockTasks });

      const { result } = renderHook(() => useAutomationStore());

      await act(async () => {
        await result.current.fetchTasks();
      });

      expect(result.current.tasks).toHaveLength(2);
    });
  });

  describe('Execute Task', () => {
    it('should execute task', async () => {
      const { executeTask } = await import('@/api/automation');
      (executeTask as any).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useAutomationStore());

      await act(async () => {
        await result.current.executeTask('task-1');
      });

      expect(executeTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Stop Task', () => {
    it('should stop task', async () => {
      const { stopTask } = await import('@/api/automation');
      (stopTask as any).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useAutomationStore());

      await act(async () => {
        await result.current.stopTask('task-1');
      });

      expect(stopTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Enable/Disable Task', () => {
    it('should enable task', async () => {
      const { enableTask } = await import('@/api/automation');
      (enableTask as any).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useAutomationStore());

      await act(async () => {
        await result.current.enableTask('task-1');
      });

      expect(enableTask).toHaveBeenCalledWith('task-1');
    });

    it('should disable task', async () => {
      const { disableTask } = await import('@/api/automation');
      (disableTask as any).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useAutomationStore());

      await act(async () => {
        await result.current.disableTask('task-1');
      });

      expect(disableTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Delete Task', () => {
    it('should delete task', async () => {
      const { deleteTask } = await import('@/api/automation');
      (deleteTask as any).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useAutomationStore());

      await act(async () => {
        await result.current.deleteTask('task-1');
      });

      expect(deleteTask).toHaveBeenCalledWith('task-1');
    });
  });
});
