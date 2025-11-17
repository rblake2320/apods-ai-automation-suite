/**
 * Store Handler - Handles memory storage operations
 */

import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, MemoryEntry, MemoryMetadata } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';
import { MemoryStore } from '../store.js';

export async function handleStore(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'key', type: 'string', required: true },
    { name: 'value', type: 'any', required: true },
    { name: 'metadata', type: 'object', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for store', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { key, value, metadata } = params as {
    key: string;
    value: unknown;
    metadata?: Partial<MemoryMetadata>;
  };

  try {
    logger.debug('Storing value', { key });

    const now = new Date().toISOString();
    const fullMetadata: MemoryMetadata = {
      type: metadata?.type,
      tags: metadata?.tags || [],
      created: now,
      updated: now,
      accessed: now,
      ttl: metadata?.ttl,
      priority: metadata?.priority || 0,
    };

    const entry: MemoryEntry = {
      key,
      value,
      metadata: fullMetadata,
    };

    await store.set(key, entry);

    logger.info('Value stored successfully', { key });

    return createSuccessResponse(id, {
      key,
      stored: true,
      metadata: fullMetadata,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to store value', { key, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to store value: ${err.message}`
    );
  }
}

export async function handleUpdate(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'key', type: 'string', required: true },
    { name: 'value', type: 'any', required: false },
    { name: 'metadata', type: 'object', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for update', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { key, value, metadata } = params as {
    key: string;
    value?: unknown;
    metadata?: Partial<MemoryMetadata>;
  };

  try {
    logger.debug('Updating value', { key });

    const existing = await store.get(key);
    if (!existing) {
      return createErrorResponse(id, ErrorCode.NotFound, `Key not found: ${key}`);
    }

    const now = new Date().toISOString();
    const updatedEntry: MemoryEntry = {
      key,
      value: value !== undefined ? value : existing.value,
      metadata: {
        ...existing.metadata!,
        ...metadata,
        updated: now,
      },
    };

    await store.set(key, updatedEntry);

    logger.info('Value updated successfully', { key });

    return createSuccessResponse(id, {
      key,
      updated: true,
      metadata: updatedEntry.metadata,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to update value', { key, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to update value: ${err.message}`
    );
  }
}

export async function handleBatchStore(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'entries', type: 'object', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for batchStore', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { entries } = params as {
    entries: Array<{ key: string; value: unknown; metadata?: Partial<MemoryMetadata> }>;
  };

  try {
    logger.debug('Batch storing values', { count: entries.length });

    const now = new Date().toISOString();
    const results: Array<{ key: string; success: boolean; error?: string }> = [];

    for (const item of entries) {
      try {
        const fullMetadata: MemoryMetadata = {
          type: item.metadata?.type,
          tags: item.metadata?.tags || [],
          created: now,
          updated: now,
          accessed: now,
          ttl: item.metadata?.ttl,
          priority: item.metadata?.priority || 0,
        };

        const entry: MemoryEntry = {
          key: item.key,
          value: item.value,
          metadata: fullMetadata,
        };

        await store.set(item.key, entry);
        results.push({ key: item.key, success: true });
      } catch (error) {
        const err = error as Error;
        results.push({
          key: item.key,
          success: false,
          error: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    logger.info('Batch store completed', {
      total: entries.length,
      successful: successCount,
      failed: entries.length - successCount,
    });

    return createSuccessResponse(id, {
      total: entries.length,
      successful: successCount,
      failed: entries.length - successCount,
      results,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to batch store values', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to batch store values: ${err.message}`
    );
  }
}

export async function handleExists(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'key', type: 'string', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for exists', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { key } = params as { key: string };

  try {
    logger.debug('Checking if key exists', { key });

    const exists = await store.has(key);

    logger.debug('Key exists check completed', { key, exists });

    return createSuccessResponse(id, {
      key,
      exists,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to check if key exists', { key, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to check if key exists: ${err.message}`
    );
  }
}
