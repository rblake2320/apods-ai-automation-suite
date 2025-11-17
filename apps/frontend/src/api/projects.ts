import { get, post, put, del, patch } from './client';
import { Project, FileNode, PaginatedResponse } from '@/types';

/**
 * Get all projects with optional filters
 */
export async function getProjects(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
  tags?: string[];
}): Promise<PaginatedResponse<Project>> {
  const response = await get<PaginatedResponse<Project>>('/projects', { params });
  return response.data;
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project> {
  const response = await get<Project>(`/projects/${id}`);
  return response.data;
}

/**
 * Create a new project
 */
export async function createProject(data: Partial<Project>): Promise<Project> {
  const response = await post<Project>('/projects', data);
  return response.data;
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const response = await put<Project>(`/projects/${id}`, data);
  return response.data;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  await del(`/projects/${id}`);
}

/**
 * Archive a project
 */
export async function archiveProject(id: string): Promise<Project> {
  const response = await patch<Project>(`/projects/${id}/archive`);
  return response.data;
}

/**
 * Unarchive a project
 */
export async function unarchiveProject(id: string): Promise<Project> {
  const response = await patch<Project>(`/projects/${id}/unarchive`);
  return response.data;
}

/**
 * Get project file tree
 */
export async function getProjectFiles(id: string, path?: string): Promise<FileNode[]> {
  const response = await get<FileNode[]>(`/projects/${id}/files`, {
    params: { path },
  });
  return response.data;
}

/**
 * Get file content
 */
export async function getFileContent(
  projectId: string,
  filePath: string
): Promise<{
  content: string;
  encoding: string;
  size: number;
  mimeType: string;
}> {
  const response = await get<{
    content: string;
    encoding: string;
    size: number;
    mimeType: string;
  }>(`/projects/${projectId}/files/content`, {
    params: { path: filePath },
  });
  return response.data;
}

/**
 * Update file content
 */
export async function updateFileContent(
  projectId: string,
  filePath: string,
  content: string
): Promise<void> {
  await put(`/projects/${projectId}/files/content`, {
    path: filePath,
    content,
  });
}

/**
 * Create a new file
 */
export async function createFile(
  projectId: string,
  filePath: string,
  content?: string
): Promise<FileNode> {
  const response = await post<FileNode>(`/projects/${projectId}/files`, {
    path: filePath,
    content: content || '',
    type: 'file',
  });
  return response.data;
}

/**
 * Create a new directory
 */
export async function createDirectory(projectId: string, dirPath: string): Promise<FileNode> {
  const response = await post<FileNode>(`/projects/${projectId}/files`, {
    path: dirPath,
    type: 'directory',
  });
  return response.data;
}

/**
 * Delete a file or directory
 */
export async function deleteFile(projectId: string, filePath: string): Promise<void> {
  await del(`/projects/${projectId}/files`, {
    params: { path: filePath },
  });
}

/**
 * Rename a file or directory
 */
export async function renameFile(
  projectId: string,
  oldPath: string,
  newPath: string
): Promise<FileNode> {
  const response = await patch<FileNode>(`/projects/${projectId}/files/rename`, {
    oldPath,
    newPath,
  });
  return response.data;
}

/**
 * Copy a file or directory
 */
export async function copyFile(
  projectId: string,
  sourcePath: string,
  destPath: string
): Promise<FileNode> {
  const response = await post<FileNode>(`/projects/${projectId}/files/copy`, {
    sourcePath,
    destPath,
  });
  return response.data;
}

/**
 * Move a file or directory
 */
export async function moveFile(
  projectId: string,
  sourcePath: string,
  destPath: string
): Promise<FileNode> {
  const response = await patch<FileNode>(`/projects/${projectId}/files/move`, {
    sourcePath,
    destPath,
  });
  return response.data;
}

/**
 * Search files in project
 */
export async function searchFiles(
  projectId: string,
  query: string,
  options?: {
    filePattern?: string;
    caseSensitive?: boolean;
    useRegex?: boolean;
  }
): Promise<
  Array<{
    path: string;
    matches: Array<{
      line: number;
      content: string;
      startColumn: number;
      endColumn: number;
    }>;
  }>
> {
  const response = await post<
    Array<{
      path: string;
      matches: Array<{
        line: number;
        content: string;
        startColumn: number;
        endColumn: number;
      }>;
    }>
  >(`/projects/${projectId}/search`, {
    query,
    ...options,
  });
  return response.data;
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: string): Promise<{
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  lastModified: string;
}> {
  const response = await get<{
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    lastModified: string;
  }>(`/projects/${projectId}/stats`);
  return response.data;
}

/**
 * Get project dependencies
 */
export async function getProjectDependencies(projectId: string): Promise<
  Array<{
    name: string;
    version: string;
    type: 'production' | 'development';
    description?: string;
  }>
> {
  const response = await get<
    Array<{
      name: string;
      version: string;
      type: 'production' | 'development';
      description?: string;
    }>
  >(`/projects/${projectId}/dependencies`);
  return response.data;
}

/**
 * Initialize git repository
 */
export async function initGitRepo(projectId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await post<{
    success: boolean;
    message: string;
  }>(`/projects/${projectId}/git/init`);
  return response.data;
}

/**
 * Get git status
 */
export async function getGitStatus(projectId: string): Promise<{
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
  staged: string[];
}> {
  const response = await get<{
    branch: string;
    ahead: number;
    behind: number;
    modified: string[];
    added: string[];
    deleted: string[];
    untracked: string[];
    staged: string[];
  }>(`/projects/${projectId}/git/status`);
  return response.data;
}

/**
 * Get git commits
 */
export async function getGitCommits(
  projectId: string,
  params?: {
    limit?: number;
    skip?: number;
    branch?: string;
  }
): Promise<
  Array<{
    hash: string;
    author: string;
    email: string;
    date: string;
    message: string;
  }>
> {
  const response = await get<
    Array<{
      hash: string;
      author: string;
      email: string;
      date: string;
      message: string;
    }>
  >(`/projects/${projectId}/git/commits`, { params });
  return response.data;
}

/**
 * Validate project configuration
 */
export async function validateProject(
  data: Partial<Project>
): Promise<{ valid: boolean; errors?: string[] }> {
  const response = await post<{ valid: boolean; errors?: string[] }>('/projects/validate', data);
  return response.data;
}

/**
 * Export project configuration
 */
export async function exportProject(id: string): Promise<Project> {
  const response = await get<Project>(`/projects/${id}/export`);
  return response.data;
}

/**
 * Import project configuration
 */
export async function importProject(data: Partial<Project>): Promise<Project> {
  const response = await post<Project>('/projects/import', data);
  return response.data;
}

/**
 * Get recently accessed projects
 */
export async function getRecentProjects(limit: number = 5): Promise<Project[]> {
  const response = await get<Project[]>('/projects/recent', {
    params: { limit },
  });
  return response.data;
}

/**
 * Update project last accessed time
 */
export async function updateProjectAccess(id: string): Promise<void> {
  await patch(`/projects/${id}/access`);
}
