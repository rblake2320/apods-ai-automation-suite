/**
 * List Directory Handler - Handles directory listing operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
  sanitizePath,
  getMimeType,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, FileMetadata } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export interface ListDirectoryParams {
  path: string;
  recursive?: boolean;
  includeHidden?: boolean;
  maxDepth?: number;
  pattern?: string;
}

export async function handleListDirectory(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'recursive', type: 'boolean', required: false },
    { name: 'includeHidden', type: 'boolean', required: false },
    { name: 'maxDepth', type: 'number', required: false },
    { name: 'pattern', type: 'string', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for listDirectory', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    path: dirPath,
    recursive = false,
    includeHidden = false,
    maxDepth = 10,
    pattern,
  } = params as ListDirectoryParams;

  const pathValidation = sanitizePath(dirPath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: dirPath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    logger.debug('Listing directory', { path: sanitizedPath, recursive });

    const stats = await fs.stat(sanitizedPath);

    if (!stats.isDirectory()) {
      return createErrorResponse(id, ErrorCode.InvalidParams, 'Path is not a directory');
    }

    const files: FileMetadata[] = [];
    const patternRegex = pattern ? new RegExp(pattern) : null;

    await listDirectoryRecursive(
      sanitizedPath,
      files,
      recursive,
      includeHidden,
      maxDepth,
      patternRegex,
      0
    );

    logger.info('Directory listed successfully', {
      path: sanitizedPath,
      fileCount: files.length,
    });

    return createSuccessResponse(id, {
      path: sanitizedPath,
      files,
      count: files.length,
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    logger.error('Failed to list directory', { path: dirPath, error: err.message });

    if (err.code === 'ENOENT') {
      return createErrorResponse(id, ErrorCode.NotFound, 'Directory not found');
    }
    if (err.code === 'EACCES') {
      return createErrorResponse(id, ErrorCode.Forbidden, 'Permission denied');
    }

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to list directory: ${err.message}`
    );
  }
}

async function listDirectoryRecursive(
  dirPath: string,
  files: FileMetadata[],
  recursive: boolean,
  includeHidden: boolean,
  maxDepth: number,
  pattern: RegExp | null,
  currentDepth: number
): Promise<void> {
  if (currentDepth >= maxDepth) {
    return;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (pattern && !pattern.test(entry.name)) {
      continue;
    }

    try {
      const stats = await fs.stat(fullPath);

      const metadata: FileMetadata = {
        path: fullPath,
        name: entry.name,
        size: stats.size,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
        mimeType: entry.isFile() ? getMimeType(fullPath) : undefined,
      };

      files.push(metadata);

      if (recursive && entry.isDirectory()) {
        await listDirectoryRecursive(
          fullPath,
          files,
          recursive,
          includeHidden,
          maxDepth,
          pattern,
          currentDepth + 1
        );
      }
    } catch (error) {
      // Skip files that can't be accessed
      continue;
    }
  }
}

export async function handleCreateDirectory(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'recursive', type: 'boolean', required: false },
    { name: 'mode', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for createDirectory', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    path: dirPath,
    recursive = true,
    mode = 0o777,
  } = params as { path: string; recursive?: boolean; mode?: number };

  const pathValidation = sanitizePath(dirPath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: dirPath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    logger.debug('Creating directory', { path: sanitizedPath, recursive });

    await fs.mkdir(sanitizedPath, { recursive, mode });

    const stats = await fs.stat(sanitizedPath);

    logger.info('Directory created successfully', { path: sanitizedPath });

    return createSuccessResponse(id, {
      path: sanitizedPath,
      created: stats.birthtime.toISOString(),
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    logger.error('Failed to create directory', { path: dirPath, error: err.message });

    if (err.code === 'EEXIST') {
      return createErrorResponse(id, ErrorCode.InvalidParams, 'Directory already exists');
    }
    if (err.code === 'EACCES') {
      return createErrorResponse(id, ErrorCode.Forbidden, 'Permission denied');
    }

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to create directory: ${err.message}`
    );
  }
}
