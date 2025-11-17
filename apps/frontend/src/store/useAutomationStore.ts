import { create } from 'zustand';
import { AutomationTask, AutomationExecution, AutomationStatus } from '@/types';
import * as automationAPI from '@/api/automation';

interface AutomationStore {
  tasks: AutomationTask[];
  currentTask: AutomationTask | null;
  executions: AutomationExecution[];
  currentExecution: AutomationExecution | null;
  isLoading: boolean;
  error: string | null;

  // Task actions
  fetchTasks: (filters?: Record<string, unknown>) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: Partial<AutomationTask>) => Promise<void>;
  updateTask: (id: string, data: Partial<AutomationTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  enableTask: (id: string) => Promise<void>;
  disableTask: (id: string) => Promise<void>;
  executeTask: (id: string) => Promise<void>;
  stopTask: (id: string) => Promise<void>;
  setCurrentTask: (task: AutomationTask | null) => void;

  // Execution actions
  fetchExecutions: (taskId: string, filters?: Record<string, unknown>) => Promise<void>;
  fetchExecution: (taskId: string, executionId: string) => Promise<void>;
  setCurrentExecution: (execution: AutomationExecution | null) => void;

  // Task status updates (for WebSocket updates)
  updateTaskStatus: (taskId: string, status: AutomationStatus) => void;
  updateExecutionStatus: (executionId: string, status: AutomationStatus) => void;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  tasks: [],
  currentTask: null,
  executions: [],
  currentExecution: null,
  isLoading: false,
  error: null,
};

/**
 * Automation store using Zustand
 * Handles automation task and execution state management
 */
export const useAutomationStore = create<AutomationStore>((set, get) => ({
  ...initialState,

  /**
   * Fetch all automation tasks with optional filters
   */
  fetchTasks: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await automationAPI.getAutomationTasks(filters);
      set({ tasks: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch a single task by ID
   */
  fetchTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const task = await automationAPI.getAutomationTask(id);
      set({ currentTask: task, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Create a new automation task
   */
  createTask: async (data: Partial<AutomationTask>) => {
    set({ isLoading: true, error: null });

    try {
      const newTask = await automationAPI.createAutomationTask(data);
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        currentTask: newTask,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update an existing automation task
   */
  updateTask: async (id: string, data: Partial<AutomationTask>) => {
    set({ isLoading: true, error: null });

    try {
      const updatedTask = await automationAPI.updateAutomationTask(id, data);

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Delete an automation task
   */
  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await automationAPI.deleteAutomationTask(id);

      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Enable an automation task
   */
  enableTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const updatedTask = await automationAPI.enableAutomationTask(id);

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Disable an automation task
   */
  disableTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const updatedTask = await automationAPI.disableAutomationTask(id);

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Execute an automation task manually
   */
  executeTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const execution = await automationAPI.executeAutomationTask(id);

      // Update task status
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status: 'running' as AutomationStatus } : t
        ),
        currentExecution: execution,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Stop a running automation task
   */
  stopTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await automationAPI.stopAutomationTask(id);

      // Update task status
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status: 'idle' as AutomationStatus } : t
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Set current task
   */
  setCurrentTask: (task: AutomationTask | null) => {
    set({ currentTask: task });
  },

  /**
   * Fetch executions for a task
   */
  fetchExecutions: async (taskId: string, filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await automationAPI.getAutomationExecutions(taskId, filters);
      set({ executions: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch executions';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch a single execution
   */
  fetchExecution: async (taskId: string, executionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const execution = await automationAPI.getAutomationExecution(taskId, executionId);
      set({ currentExecution: execution, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch execution';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Set current execution
   */
  setCurrentExecution: (execution: AutomationExecution | null) => {
    set({ currentExecution: execution });
  },

  /**
   * Update task status (for real-time updates)
   */
  updateTaskStatus: (taskId: string, status: AutomationStatus) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      currentTask:
        state.currentTask?.id === taskId ? { ...state.currentTask, status } : state.currentTask,
    }));
  },

  /**
   * Update execution status (for real-time updates)
   */
  updateExecutionStatus: (executionId: string, status: AutomationStatus) => {
    set((state) => ({
      executions: state.executions.map((e) => (e.id === executionId ? { ...e, status } : e)),
      currentExecution:
        state.currentExecution?.id === executionId
          ? { ...state.currentExecution, status }
          : state.currentExecution,
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
