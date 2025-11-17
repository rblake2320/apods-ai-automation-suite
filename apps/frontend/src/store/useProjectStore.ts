import { create } from 'zustand';
import { Project, FileNode } from '@/types';
import * as projectsAPI from '@/api/projects';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  isLoading: boolean;
  error: string | null;

  // Project actions
  fetchProjects: (filters?: Record<string, unknown>) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;

  // File tree actions
  fetchFileTree: (projectId: string, path?: string) => Promise<void>;
  setSelectedFile: (file: FileNode | null) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  fileTree: [],
  selectedFile: null,
  isLoading: false,
  error: null,
};

/**
 * Project store using Zustand
 * Handles project and file tree state management
 */
export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...initialState,

  /**
   * Fetch all projects with optional filters
   */
  fetchProjects: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await projectsAPI.getProjects(filters);
      set({ projects: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch a single project by ID
   */
  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const project = await projectsAPI.getProject(id);
      set({ currentProject: project, isLoading: false });

      // Update project access time
      await projectsAPI.updateProjectAccess(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Create a new project
   */
  createProject: async (data: Partial<Project>) => {
    set({ isLoading: true, error: null });

    try {
      const newProject = await projectsAPI.createProject(data);
      set((state) => ({
        projects: [newProject, ...state.projects],
        currentProject: newProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update an existing project
   */
  updateProject: async (id: string, data: Partial<Project>) => {
    set({ isLoading: true, error: null });

    try {
      const updatedProject = await projectsAPI.updateProject(id, data);

      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Delete a project
   */
  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await projectsAPI.deleteProject(id);

      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Set current project
   */
  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  /**
   * Fetch file tree for a project
   */
  fetchFileTree: async (projectId: string, path?: string) => {
    set({ isLoading: true, error: null });

    try {
      const files = await projectsAPI.getProjectFiles(projectId, path);
      set({ fileTree: files, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch file tree';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Set selected file
   */
  setSelectedFile: (file: FileNode | null) => {
    set({ selectedFile: file });
  },

  /**
   * Expand a tree node
   */
  expandNode: (nodeId: string) => {
    set((state) => ({
      fileTree: expandNodeRecursive(state.fileTree, nodeId),
    }));
  },

  /**
   * Collapse a tree node
   */
  collapseNode: (nodeId: string) => {
    set((state) => ({
      fileTree: collapseNodeRecursive(state.fileTree, nodeId),
    }));
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

/**
 * Helper function to expand a node recursively
 */
function expandNodeRecursive(nodes: FileNode[], nodeId: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, isExpanded: true };
    }
    if (node.children) {
      return { ...node, children: expandNodeRecursive(node.children, nodeId) };
    }
    return node;
  });
}

/**
 * Helper function to collapse a node recursively
 */
function collapseNodeRecursive(nodes: FileNode[], nodeId: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, isExpanded: false };
    }
    if (node.children) {
      return { ...node, children: collapseNodeRecursive(node.children, nodeId) };
    }
    return node;
  });
}
