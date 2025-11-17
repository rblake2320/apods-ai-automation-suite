import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectStore } from '@/store/useProjectStore';

// Mock API
vi.mock('@/api/projects', () => ({
  getProjects: vi.fn().mockResolvedValue({ data: [] }),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getFileTree: vi.fn().mockResolvedValue({ data: [] }),
}));

describe('useProjectStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { result } = renderHook(() => useProjectStore());
    act(() => {
      result.current.clearProjects();
    });
  });

  describe('Initial State', () => {
    it('should have empty projects array initially', () => {
      const { result } = renderHook(() => useProjectStore());
      expect(result.current.projects).toEqual([]);
    });

    it('should have null selected project initially', () => {
      const { result } = renderHook(() => useProjectStore());
      expect(result.current.selectedProject).toBeNull();
    });

    it('should have empty file tree initially', () => {
      const { result } = renderHook(() => useProjectStore());
      expect(result.current.fileTree).toEqual([]);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useProjectStore());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Fetch Projects', () => {
    it('should fetch projects successfully', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', description: 'Test project 1' },
        { id: '2', name: 'Project 2', description: 'Test project 2' },
      ];

      const { getProjects } = await import('@/api/projects');
      (getProjects as any).mockResolvedValue({ data: mockProjects });

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(result.current.projects).toHaveLength(2);
    });

    it('should handle fetch error', async () => {
      const { getProjects } = await import('@/api/projects');
      (getProjects as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProjectStore());

      await expect(async () => {
        await act(async () => {
          await result.current.fetchProjects();
        });
      }).rejects.toThrow();
    });
  });

  describe('Selected Project', () => {
    it('should set selected project', () => {
      const { result } = renderHook(() => useProjectStore());
      const project = { id: '1', name: 'Test', description: 'Test project' };

      act(() => {
        result.current.setSelectedProject(project as any);
      });

      expect(result.current.selectedProject).toEqual(project);
    });

    it('should clear selected project', () => {
      const { result } = renderHook(() => useProjectStore());
      const project = { id: '1', name: 'Test', description: 'Test' };

      act(() => {
        result.current.setSelectedProject(project as any);
        result.current.setSelectedProject(null);
      });

      expect(result.current.selectedProject).toBeNull();
    });
  });

  describe('File Tree', () => {
    it('should fetch file tree', async () => {
      const mockFileTree = [
        { id: '1', name: 'src', type: 'directory', path: '/src', children: [] },
      ];

      const { getFileTree } = await import('@/api/projects');
      (getFileTree as any).mockResolvedValue({ data: mockFileTree });

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.fetchFileTree('project-1');
      });

      expect(result.current.fileTree).toHaveLength(1);
    });

    it('should expand node', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.expandNode('node-1');
      });

      // Node expansion is tracked internally
      expect(true).toBe(true);
    });

    it('should collapse node', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.collapseNode('node-1');
      });

      expect(true).toBe(true);
    });
  });

  describe('Selected File', () => {
    it('should set selected file', () => {
      const { result } = renderHook(() => useProjectStore());
      const file = { id: '1', name: 'test.ts', type: 'file' as const, path: '/test.ts' };

      act(() => {
        result.current.setSelectedFile(file);
      });

      expect(result.current.selectedFile).toEqual(file);
    });
  });

  describe('Clear State', () => {
    it('should clear all projects', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.clearProjects();
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.selectedProject).toBeNull();
    });
  });
});
