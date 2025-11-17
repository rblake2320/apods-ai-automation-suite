/**
 * Watch Handler - Handles file watching operations
 */

import * as fs from 'fs';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
  sanitizePath,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, WatchOptions, FileWatchEvent } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

interface Watcher {
  id: string;
  path: string;
  watcher: fs.FSWatcher;
  callback: (event: FileWatchEvent) => void;
}

const watchers = new Map<string, Watcher>();

export async function handleWatchStart(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger,
  eventCallback: (watchId: string, event: FileWatchEvent) => void
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'recursive', type: 'boolean', required: false },
    { name: 'events', type: 'object', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for watchStart', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    path: watchPath,
    recursive = false,
    events = ['add', 'change', 'unlink'],
  } = params as WatchOptions & { path: string };

  const pathValidation = sanitizePath(watchPath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: watchPath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    const watchId = `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.debug('Starting file watch', { path: sanitizedPath, watchId, recursive });

    const watcher = fs.watch(sanitizedPath, { recursive }, (eventType, filename) => {
      if (!filename) return;

      let mappedEvent: 'add' | 'change' | 'unlink';

      if (eventType === 'rename') {
        try {
          fs.accessSync(`${sanitizedPath}/${filename}`);
          mappedEvent = 'add';
        } catch {
          mappedEvent = 'unlink';
        }
      } else {
        mappedEvent = 'change';
      }

      if (events.includes(mappedEvent)) {
        const event: FileWatchEvent = {
          type: mappedEvent,
          path: `${sanitizedPath}/${filename}`,
          timestamp: new Date().toISOString(),
        };

        eventCallback(watchId, event);
        logger.debug('File watch event', { watchId, event: mappedEvent, path: event.path });
      }
    });

    watcher.on('error', (error) => {
      logger.error('File watcher error', { watchId, error: error.message });
      watchers.delete(watchId);
    });

    const callback = (event: FileWatchEvent) => {
      eventCallback(watchId, event);
    };

    watchers.set(watchId, {
      id: watchId,
      path: sanitizedPath,
      watcher,
      callback,
    });

    logger.info('File watch started', { path: sanitizedPath, watchId });

    return createSuccessResponse(id, {
      watchId,
      path: sanitizedPath,
      started: true,
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    logger.error('Failed to start file watch', { path: watchPath, error: err.message });

    if (err.code === 'ENOENT') {
      return createErrorResponse(id, ErrorCode.NotFound, 'Path not found');
    }
    if (err.code === 'EACCES') {
      return createErrorResponse(id, ErrorCode.Forbidden, 'Permission denied');
    }

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to start watch: ${err.message}`
    );
  }
}

export async function handleWatchStop(
  id: string | number,
  params: Record<string, unknown>,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'watchId', type: 'string', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for watchStop', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { watchId } = params as { watchId: string };

  const watcher = watchers.get(watchId);
  if (!watcher) {
    logger.warn('Watch not found', { watchId });
    return createErrorResponse(id, ErrorCode.NotFound, 'Watch not found');
  }

  try {
    watcher.watcher.close();
    watchers.delete(watchId);

    logger.info('File watch stopped', { watchId, path: watcher.path });

    return createSuccessResponse(id, {
      watchId,
      stopped: true,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to stop file watch', { watchId, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Failed to stop watch: ${err.message}`);
  }
}

export async function handleWatchList(
  id: string | number,
  logger: Logger
): Promise<JsonRpcResponse> {
  const activeWatches = Array.from(watchers.values()).map((w) => ({
    watchId: w.id,
    path: w.path,
  }));

  logger.debug('Listing active watches', { count: activeWatches.length });

  return createSuccessResponse(id, {
    watches: activeWatches,
    count: activeWatches.length,
  });
}

export function stopAllWatchers(logger: Logger): void {
  logger.info('Stopping all file watchers', { count: watchers.size });

  for (const watcher of watchers.values()) {
    try {
      watcher.watcher.close();
    } catch (error) {
      logger.error('Error closing watcher', {
        watchId: watcher.id,
        error: (error as Error).message,
      });
    }
  }

  watchers.clear();
}
