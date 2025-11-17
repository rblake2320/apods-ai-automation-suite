import { get, post, put, del, patch } from './client';
import {
  AutomationTask,
  AutomationExecution,
  AutomationLog,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

/**
 * Get all automation tasks with optional filters
 */
export async function getAutomationTasks(params?: {
  page?: number;
  limit?: number;
  status?: string;
  projectId?: string;
  search?: string;
}): Promise<PaginatedResponse<AutomationTask>> {
  const response = await get<PaginatedResponse<AutomationTask>>('/automation/tasks', { params });
  return response.data;
}

/**
 * Get a single automation task by ID
 */
export async function getAutomationTask(id: string): Promise<AutomationTask> {
  const response = await get<AutomationTask>(`/automation/tasks/${id}`);
  return response.data;
}

/**
 * Create a new automation task
 */
export async function createAutomationTask(data: Partial<AutomationTask>): Promise<AutomationTask> {
  const response = await post<AutomationTask>('/automation/tasks', data);
  return response.data;
}

/**
 * Update an existing automation task
 */
export async function updateAutomationTask(
  id: string,
  data: Partial<AutomationTask>
): Promise<AutomationTask> {
  const response = await put<AutomationTask>(`/automation/tasks/${id}`, data);
  return response.data;
}

/**
 * Delete an automation task
 */
export async function deleteAutomationTask(id: string): Promise<void> {
  await del(`/automation/tasks/${id}`);
}

/**
 * Enable an automation task
 */
export async function enableAutomationTask(id: string): Promise<AutomationTask> {
  const response = await patch<AutomationTask>(`/automation/tasks/${id}/enable`);
  return response.data;
}

/**
 * Disable an automation task
 */
export async function disableAutomationTask(id: string): Promise<AutomationTask> {
  const response = await patch<AutomationTask>(`/automation/tasks/${id}/disable`);
  return response.data;
}

/**
 * Execute an automation task manually
 */
export async function executeAutomationTask(id: string): Promise<AutomationExecution> {
  const response = await post<AutomationExecution>(`/automation/tasks/${id}/execute`);
  return response.data;
}

/**
 * Stop a running automation task
 */
export async function stopAutomationTask(id: string): Promise<void> {
  await post(`/automation/tasks/${id}/stop`);
}

/**
 * Get execution history for a task
 */
export async function getAutomationExecutions(
  taskId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<PaginatedResponse<AutomationExecution>> {
  const response = await get<PaginatedResponse<AutomationExecution>>(
    `/automation/tasks/${taskId}/executions`,
    { params }
  );
  return response.data;
}

/**
 * Get a single execution by ID
 */
export async function getAutomationExecution(
  taskId: string,
  executionId: string
): Promise<AutomationExecution> {
  const response = await get<AutomationExecution>(
    `/automation/tasks/${taskId}/executions/${executionId}`
  );
  return response.data;
}

/**
 * Get logs for an execution
 */
export async function getExecutionLogs(
  taskId: string,
  executionId: string,
  params?: {
    level?: string;
    limit?: number;
  }
): Promise<AutomationLog[]> {
  const response = await get<AutomationLog[]>(
    `/automation/tasks/${taskId}/executions/${executionId}/logs`,
    { params }
  );
  return response.data;
}

/**
 * Get automation statistics
 */
export async function getAutomationStats(): Promise<{
  totalTasks: number;
  activeTasks: number;
  runningTasks: number;
  completedToday: number;
  failedToday: number;
  successRate: number;
  averageExecutionTime: number;
}> {
  const response = await get<{
    totalTasks: number;
    activeTasks: number;
    runningTasks: number;
    completedToday: number;
    failedToday: number;
    successRate: number;
    averageExecutionTime: number;
  }>('/automation/stats');
  return response.data;
}

/**
 * Validate automation task configuration
 */
export async function validateAutomationTask(
  data: Partial<AutomationTask>
): Promise<{ valid: boolean; errors?: string[] }> {
  const response = await post<{ valid: boolean; errors?: string[] }>(
    '/automation/tasks/validate',
    data
  );
  return response.data;
}

/**
 * Duplicate an automation task
 */
export async function duplicateAutomationTask(id: string): Promise<AutomationTask> {
  const response = await post<AutomationTask>(`/automation/tasks/${id}/duplicate`);
  return response.data;
}

/**
 * Export automation task as JSON
 */
export async function exportAutomationTask(id: string): Promise<AutomationTask> {
  const response = await get<AutomationTask>(`/automation/tasks/${id}/export`);
  return response.data;
}

/**
 * Import automation task from JSON
 */
export async function importAutomationTask(data: Partial<AutomationTask>): Promise<AutomationTask> {
  const response = await post<AutomationTask>('/automation/tasks/import', data);
  return response.data;
}

/**
 * Get available action types
 */
export async function getActionTypes(): Promise<
  Array<{
    type: string;
    name: string;
    description: string;
    configSchema: Record<string, unknown>;
  }>
> {
  const response = await get<
    Array<{
      type: string;
      name: string;
      description: string;
      configSchema: Record<string, unknown>;
    }>
  >('/automation/action-types');
  return response.data;
}

/**
 * Get available trigger types
 */
export async function getTriggerTypes(): Promise<
  Array<{
    type: string;
    name: string;
    description: string;
    configSchema: Record<string, unknown>;
  }>
> {
  const response = await get<
    Array<{
      type: string;
      name: string;
      description: string;
      configSchema: Record<string, unknown>;
    }>
  >('/automation/trigger-types');
  return response.data;
}
