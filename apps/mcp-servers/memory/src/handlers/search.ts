/**
 * Search Handler - Handles memory search operations
 */

import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, MemoryQuery, MemoryEntry } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';
import { MemoryStore } from '../store.js';

export async function handleSearch(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'key', type: 'string', required: false },
    { name: 'pattern', type: 'string', required: false },
    { name: 'tags', type: 'object', required: false },
    { name: 'type', type: 'string', required: false },
    { name: 'limit', type: 'number', required: false },
    { name: 'offset', type: 'number', required: false },
    { name: 'sortBy', type: 'string', required: false },
    { name: 'sortOrder', type: 'string', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for search', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const query = params as MemoryQuery;
  const {
    key,
    pattern,
    tags = [],
    type,
    limit = 100,
    offset = 0,
    sortBy = 'created',
    sortOrder = 'desc',
  } = query;

  try {
    logger.debug('Searching memory', { query });

    const allKeys = await store.keys();
    let entries: Array<{ key: string; entry: MemoryEntry }> = [];

    for (const k of allKeys) {
      const entry = await store.get(k);
      if (!entry) continue;

      let matches = true;

      if (key && k !== key) {
        matches = false;
      }

      if (pattern && matches) {
        const regex = new RegExp(pattern);
        if (!regex.test(k)) {
          matches = false;
        }
      }

      if (type && matches) {
        if (entry.metadata?.type !== type) {
          matches = false;
        }
      }

      if (tags.length > 0 && matches) {
        const entryTags = entry.metadata?.tags || [];
        const hasAllTags = tags.every((tag) => entryTags.includes(tag));
        if (!hasAllTags) {
          matches = false;
        }
      }

      if (matches) {
        entries.push({ key: k, entry });
      }
    }

    entries.sort((a, b) => {
      let aValue: string | number = 0;
      let bValue: string | number = 0;

      switch (sortBy) {
        case 'created':
          aValue = a.entry.metadata?.created || '';
          bValue = b.entry.metadata?.created || '';
          break;
        case 'updated':
          aValue = a.entry.metadata?.updated || '';
          bValue = b.entry.metadata?.updated || '';
          break;
        case 'accessed':
          aValue = a.entry.metadata?.accessed || '';
          bValue = b.entry.metadata?.accessed || '';
          break;
        case 'priority':
          aValue = a.entry.metadata?.priority || 0;
          bValue = b.entry.metadata?.priority || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    const paginatedEntries = entries.slice(offset, offset + limit);

    const results = paginatedEntries.map(({ key, entry }) => ({
      key,
      value: entry.value,
      metadata: entry.metadata,
    }));

    logger.info('Search completed', {
      total: entries.length,
      returned: results.length,
    });

    return createSuccessResponse(id, {
      results,
      total: entries.length,
      limit,
      offset,
      hasMore: offset + limit < entries.length,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Search failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Search failed: ${err.message}`);
  }
}

export async function handleSearchByTag(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'tags', type: 'object', required: true },
    { name: 'matchAll', type: 'boolean', required: false },
    { name: 'limit', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for searchByTag', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    tags,
    matchAll = true,
    limit = 100,
  } = params as { tags: string[]; matchAll?: boolean; limit?: number };

  try {
    logger.debug('Searching by tags', { tags, matchAll });

    const allKeys = await store.keys();
    const results: Array<{ key: string; value: unknown; metadata?: unknown }> = [];

    for (const key of allKeys) {
      if (results.length >= limit) break;

      const entry = await store.get(key);
      if (!entry || !entry.metadata) continue;

      const entryTags = entry.metadata.tags || [];
      const matches = matchAll
        ? tags.every((tag) => entryTags.includes(tag))
        : tags.some((tag) => entryTags.includes(tag));

      if (matches) {
        results.push({
          key,
          value: entry.value,
          metadata: entry.metadata,
        });
      }
    }

    logger.info('Tag search completed', { found: results.length });

    return createSuccessResponse(id, {
      results,
      count: results.length,
      tags,
      matchAll,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Tag search failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Tag search failed: ${err.message}`);
  }
}

export async function handleSearchByType(
  id: string | number,
  params: Record<string, unknown>,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'type', type: 'string', required: true },
    { name: 'limit', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for searchByType', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { type, limit = 100 } = params as { type: string; limit?: number };

  try {
    logger.debug('Searching by type', { type });

    const allKeys = await store.keys();
    const results: Array<{ key: string; value: unknown; metadata?: unknown }> = [];

    for (const key of allKeys) {
      if (results.length >= limit) break;

      const entry = await store.get(key);
      if (!entry || !entry.metadata) continue;

      if (entry.metadata.type === type) {
        results.push({
          key,
          value: entry.value,
          metadata: entry.metadata,
        });
      }
    }

    logger.info('Type search completed', { type, found: results.length });

    return createSuccessResponse(id, {
      results,
      count: results.length,
      type,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Type search failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Type search failed: ${err.message}`);
  }
}

export async function handleGetStats(
  id: string | number,
  store: MemoryStore,
  logger: Logger
): Promise<JsonRpcResponse> {
  try {
    logger.debug('Getting memory stats');

    const stats = await store.getStats();

    logger.info('Stats retrieved', { totalEntries: stats.totalEntries });

    return createSuccessResponse(id, stats);
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to get stats', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Failed to get stats: ${err.message}`);
  }
}
