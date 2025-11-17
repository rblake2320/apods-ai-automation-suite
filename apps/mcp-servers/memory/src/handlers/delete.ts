/**
 * Delete Handler - Handles memory deletion operations
 */

import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';
import { MemoryStore } from '../store.js';

export async function handleDelete(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'key', type: 'string', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for delete', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { key } = params as { key: string };

  try {
    logger.debug('Deleting key', { key });

    const existed = await store.has(key);
    if (!existed) {
      return createErrorResponse(id, ErrorCode.NotFound, `Key not found: ${key}`);
    }

    await store.delete(key);

    logger.info('Key deleted successfully', { key });

    return createSuccessResponse(id, {
      key,
      deleted: true,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to delete key', { key, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Failed to delete key: ${err.message}`);
  }
}

export async function handleDeleteMultiple(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'keys', type: 'object', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for deleteMultiple', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { keys } = params as { keys: string[] };

  try {
    logger.debug('Deleting multiple keys', { count: keys.length });

    const results: Array<{ key: string; deleted: boolean; error?: string }> = [];

    for (const key of keys) {
      try {
        const existed = await store.has(key);
        if (existed) {
          await store.delete(key);
          results.push({ key, deleted: true });
        } else {
          results.push({
            key,
            deleted: false,
            error: 'Key not found',
          });
        }
      } catch (error) {
        const err = error as Error;
        results.push({
          key,
          deleted: false,
          error: err.message,
        });
      }
    }

    const deletedCount = results.filter((r) => r.deleted).length;

    logger.info('Multiple keys deletion completed', {
      total: keys.length,
      deleted: deletedCount,
      failed: keys.length - deletedCount,
    });

    return createSuccessResponse(id, {
      total: keys.length,
      deleted: deletedCount,
      failed: keys.length - deletedCount,
      results,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to delete multiple keys', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to delete multiple keys: ${err.message}`
    );
  }
}

export async function handleDeleteByPattern(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'pattern', type: 'string', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for deleteByPattern', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { pattern } = params as { pattern: string };

  try {
    logger.debug('Deleting keys by pattern', { pattern });

    const regex = new RegExp(pattern);
    const allKeys = await store.keys();
    const matchingKeys = allKeys.filter((key) => regex.test(key));

    let deletedCount = 0;
    for (const key of matchingKeys) {
      try {
        await store.delete(key);
        deletedCount++;
      } catch (error) {
        logger.warn('Failed to delete key', { key, error: (error as Error).message });
      }
    }

    logger.info('Pattern deletion completed', {
      pattern,
      matched: matchingKeys.length,
      deleted: deletedCount,
    });

    return createSuccessResponse(id, {
      pattern,
      matched: matchingKeys.length,
      deleted: deletedCount,
      keys: matchingKeys,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to delete by pattern', { pattern, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to delete by pattern: ${err.message}`
    );
  }
}

export async function handleDeleteByTag(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'tags', type: 'object', required: true },
    { name: 'matchAll', type: 'boolean', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for deleteByTag', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { tags, matchAll = true } = params as { tags: string[]; matchAll?: boolean };

  try {
    logger.debug('Deleting keys by tag', { tags, matchAll });

    const allKeys = await store.keys();
    const keysToDelete: string[] = [];

    for (const key of allKeys) {
      const entry = await store.get(key);
      if (!entry || !entry.metadata) continue;

      const entryTags = entry.metadata.tags || [];
      const matches = matchAll
        ? tags.every((tag) => entryTags.includes(tag))
        : tags.some((tag) => entryTags.includes(tag));

      if (matches) {
        keysToDelete.push(key);
      }
    }

    let deletedCount = 0;
    for (const key of keysToDelete) {
      try {
        await store.delete(key);
        deletedCount++;
      } catch (error) {
        logger.warn('Failed to delete key', { key, error: (error as Error).message });
      }
    }

    logger.info('Tag deletion completed', {
      tags,
      matched: keysToDelete.length,
      deleted: deletedCount,
    });

    return createSuccessResponse(id, {
      tags,
      matchAll,
      matched: keysToDelete.length,
      deleted: deletedCount,
      keys: keysToDelete,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to delete by tag', { tags, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to delete by tag: ${err.message}`
    );
  }
}

export async function handleClear(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'confirm', type: 'boolean', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for clear', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { confirm } = params as { confirm: boolean };

  if (!confirm) {
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Clear operation requires explicit confirmation'
    );
  }

  try {
    logger.warn('Clearing all memory');

    const sizeBefore = await store.size();
    await store.clear();
    const sizeAfter = await store.size();

    logger.warn('Memory cleared', { entriesDeleted: sizeBefore });

    return createSuccessResponse(id, {
      cleared: true,
      entriesDeleted: sizeBefore,
      currentSize: sizeAfter,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to clear memory', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to clear memory: ${err.message}`
    );
  }
}

export async function handleDeleteExpired(
  id: string | number,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  try {
    logger.debug('Deleting expired entries');

    const now = Date.now();
    const allKeys = await store.keys();
    const expiredKeys: string[] = [];

    for (const key of allKeys) {
      const entry = await store.get(key);
      if (!entry || !entry.metadata || !entry.metadata.ttl) continue;

      const createdTime = new Date(entry.metadata.created).getTime();
      const expiryTime = createdTime + entry.metadata.ttl;

      if (now > expiryTime) {
        expiredKeys.push(key);
      }
    }

    let deletedCount = 0;
    for (const key of expiredKeys) {
      try {
        await store.delete(key);
        deletedCount++;
      } catch (error) {
        logger.warn('Failed to delete expired key', {
          key,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Expired entries deleted', {
      found: expiredKeys.length,
      deleted: deletedCount,
    });

    return createSuccessResponse(id, {
      found: expiredKeys.length,
      deleted: deletedCount,
      keys: expiredKeys,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to delete expired entries', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to delete expired entries: ${err.message}`
    );
  }
}
