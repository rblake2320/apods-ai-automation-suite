import { get, post, put, del, patch } from './client';
import { MCPServer, MCPTool, MCPResource, PaginatedResponse } from '@/types';

/**
 * Get all MCP servers with optional filters
 */
export async function getMCPServers(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}): Promise<PaginatedResponse<MCPServer>> {
  const response = await get<PaginatedResponse<MCPServer>>('/mcp/servers', { params });
  return response.data;
}

/**
 * Get a single MCP server by ID
 */
export async function getMCPServer(id: string): Promise<MCPServer> {
  const response = await get<MCPServer>(`/mcp/servers/${id}`);
  return response.data;
}

/**
 * Create a new MCP server
 */
export async function createMCPServer(data: Partial<MCPServer>): Promise<MCPServer> {
  const response = await post<MCPServer>('/mcp/servers', data);
  return response.data;
}

/**
 * Update an existing MCP server
 */
export async function updateMCPServer(id: string, data: Partial<MCPServer>): Promise<MCPServer> {
  const response = await put<MCPServer>(`/mcp/servers/${id}`, data);
  return response.data;
}

/**
 * Delete an MCP server
 */
export async function deleteMCPServer(id: string): Promise<void> {
  await del(`/mcp/servers/${id}`);
}

/**
 * Start an MCP server
 */
export async function startMCPServer(id: string): Promise<MCPServer> {
  const response = await post<MCPServer>(`/mcp/servers/${id}/start`);
  return response.data;
}

/**
 * Stop an MCP server
 */
export async function stopMCPServer(id: string): Promise<MCPServer> {
  const response = await post<MCPServer>(`/mcp/servers/${id}/stop`);
  return response.data;
}

/**
 * Restart an MCP server
 */
export async function restartMCPServer(id: string): Promise<MCPServer> {
  const response = await post<MCPServer>(`/mcp/servers/${id}/restart`);
  return response.data;
}

/**
 * Check health of an MCP server
 */
export async function checkMCPServerHealth(id: string): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  message?: string;
  timestamp: string;
}> {
  const response = await get<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    latency: number;
    message?: string;
    timestamp: string;
  }>(`/mcp/servers/${id}/health`);
  return response.data;
}

/**
 * Get metrics for an MCP server
 */
export async function getMCPServerMetrics(id: string): Promise<{
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
  lastError?: string;
  lastErrorAt?: string;
}> {
  const response = await get<{
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    uptime: number;
    lastError?: string;
    lastErrorAt?: string;
  }>(`/mcp/servers/${id}/metrics`);
  return response.data;
}

/**
 * Get tools provided by an MCP server
 */
export async function getMCPServerTools(
  serverId: string,
  params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }
): Promise<PaginatedResponse<MCPTool>> {
  const response = await get<PaginatedResponse<MCPTool>>(`/mcp/servers/${serverId}/tools`, {
    params,
  });
  return response.data;
}

/**
 * Get a single MCP tool by ID
 */
export async function getMCPTool(serverId: string, toolId: string): Promise<MCPTool> {
  const response = await get<MCPTool>(`/mcp/servers/${serverId}/tools/${toolId}`);
  return response.data;
}

/**
 * Execute an MCP tool
 */
export async function executeMCPTool(
  serverId: string,
  toolId: string,
  input: Record<string, unknown>
): Promise<{
  success: boolean;
  output: unknown;
  error?: string;
  executionTime: number;
}> {
  const response = await post<{
    success: boolean;
    output: unknown;
    error?: string;
    executionTime: number;
  }>(`/mcp/servers/${serverId}/tools/${toolId}/execute`, { input });
  return response.data;
}

/**
 * Get resources provided by an MCP server
 */
export async function getMCPServerResources(
  serverId: string,
  params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }
): Promise<PaginatedResponse<MCPResource>> {
  const response = await get<PaginatedResponse<MCPResource>>(`/mcp/servers/${serverId}/resources`, {
    params,
  });
  return response.data;
}

/**
 * Get a single MCP resource by ID
 */
export async function getMCPResource(serverId: string, resourceId: string): Promise<MCPResource> {
  const response = await get<MCPResource>(`/mcp/servers/${serverId}/resources/${resourceId}`);
  return response.data;
}

/**
 * Read content from an MCP resource
 */
export async function readMCPResource(
  serverId: string,
  resourceId: string
): Promise<{
  content: string;
  mimeType: string;
}> {
  const response = await get<{
    content: string;
    mimeType: string;
  }>(`/mcp/servers/${serverId}/resources/${resourceId}/content`);
  return response.data;
}

/**
 * Get MCP server statistics
 */
export async function getMCPStats(): Promise<{
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  totalTools: number;
  totalResources: number;
  averageResponseTime: number;
}> {
  const response = await get<{
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    totalTools: number;
    totalResources: number;
    averageResponseTime: number;
  }>('/mcp/stats');
  return response.data;
}

/**
 * Validate MCP server configuration
 */
export async function validateMCPServer(
  data: Partial<MCPServer>
): Promise<{ valid: boolean; errors?: string[] }> {
  const response = await post<{ valid: boolean; errors?: string[] }>('/mcp/servers/validate', data);
  return response.data;
}

/**
 * Test MCP server connection
 */
export async function testMCPServerConnection(data: Partial<MCPServer>): Promise<{
  success: boolean;
  message: string;
  latency?: number;
}> {
  const response = await post<{
    success: boolean;
    message: string;
    latency?: number;
  }>('/mcp/servers/test-connection', data);
  return response.data;
}

/**
 * Export MCP server configuration
 */
export async function exportMCPServer(id: string): Promise<MCPServer> {
  const response = await get<MCPServer>(`/mcp/servers/${id}/export`);
  return response.data;
}

/**
 * Import MCP server configuration
 */
export async function importMCPServer(data: Partial<MCPServer>): Promise<MCPServer> {
  const response = await post<MCPServer>('/mcp/servers/import', data);
  return response.data;
}

/**
 * Get available MCP server types
 */
export async function getMCPServerTypes(): Promise<
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
  >('/mcp/server-types');
  return response.data;
}
