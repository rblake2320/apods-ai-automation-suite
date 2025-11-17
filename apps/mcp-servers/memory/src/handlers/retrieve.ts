/**
 * Retrieve Handler - Handles memory retrieval operations
 */

import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';
import { MemoryStore } from '../store.js';

export async function handleRetrieve(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'key', type: 'string', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for retrieve', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { key } = params as { key: string };

  try {
    logger.debug('Retrieving value', { key });

    const entry = await store.get(key);

    if (!entry) {
      return createErrorResponse(id, ErrorCode.NotFound, `Key not found: ${key}`);
    }

    const now = new Date().toISOString();
    if (entry.metadata) {
      entry.metadata.accessed = now;
      await store.set(key, entry);
    }

    logger.info('Value retrieved successfully', { key });

    return createSuccessResponse(id, {
      key,
      value: entry.value,
      metadata: entry.metadata,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to retrieve value', { key, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to retrieve value: ${err.message}`
    );
  }
}

export async function handleRetrieveMultiple(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'keys', type: 'object', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for retrieveMultiple', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { keys } = params as { keys: string[] };

  try {
    logger.debug('Retrieving multiple values', { count: keys.length });

    const results: Array<{ key: string; value?: unknown; metadata?: unknown; found: boolean }> = [];
    const now = new Date().toISOString();

    for (const key of keys) {
      try {
        const entry = await store.get(key);
        if (entry) {
          if (entry.metadata) {
            entry.metadata.accessed = now;
            await store.set(key, entry);
          }
          results.push({
            key,
            value: entry.value,
            metadata: entry.metadata,
            found: true,
          });
        } else {
          results.push({
            key,
            found: false,
          });
        }
      } catch (error) {
        results.push({
          key,
          found: false,
        });
      }
    }

    const foundCount = results.filter((r) => r.found).length;

    logger.info('Multiple values retrieved', {
      total: keys.length,
      found: foundCount,
      notFound: keys.length - foundCount,
    });

    return createSuccessResponse(id, {
      total: keys.length,
      found: foundCount,
      notFound: keys.length - foundCount,
      results,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to retrieve multiple values', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to retrieve multiple values: ${err.message}`
    );
  }
}

export async function handleList(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'limit', type: 'number', required: false },
    { name: 'offset', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for list', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { limit = 100, offset = 0 } = params as { limit?: number; offset?: number };

  try {
    logger.debug('Listing keys', { limit, offset });

    const allKeys = await store.keys();
    const paginatedKeys = allKeys.slice(offset, offset + limit);

    const entries = await Promise.all(
      paginatedKeys.map(async (key) => {
        const entry = await store.get(key);
        return {
          key,
          metadata: entry?.metadata,
        };
      })
    );

    logger.info('Keys listed successfully', {
      total: allKeys.length,
      returned: entries.length,
    });

    return createSuccessResponse(id, {
      entries,
      total: allKeys.length,
      limit,
      offset,
      hasMore: offset + limit < allKeys.length,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to list keys', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Failed to list keys: ${err.message}`);
  }
}

export async function handleSize(
  id: string | number,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  try {
    logger.debug('Getting store size');

    const size = await store.size();

    logger.debug('Store size retrieved', { size });

    return createSuccessResponse(id, {
      size,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to get store size', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to get store size: ${err.message}`
    );
  }
}

export async function handleKeys(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'pattern', type: 'string', required: false }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for keys', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { pattern } = params as { pattern?: string };

  try {
    logger.debug('Getting keys', { pattern });

    let keys = await store.keys();

    if (pattern) {
      const regex = new RegExp(pattern);
      keys = keys.filter((key) => regex.test(key));
    }

    logger.info('Keys retrieved', { count: keys.length });

    return createSuccessResponse(id, {
      keys,
      count: keys.length,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to get keys', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Failed to get keys: ${err.message}`);
  }
}
