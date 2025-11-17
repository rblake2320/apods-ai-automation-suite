/**
 * Write File Handler - Handles file writing operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
  sanitizePath,
  pathExists,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export interface WriteFileParams {
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64' | 'binary';
  createDirectory?: boolean;
  overwrite?: boolean;
  append?: boolean;
  mode?: number;
}

export async function handleWriteFile(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'content', type: 'string', required: true },
    { name: 'encoding', type: 'string', required: false },
    { name: 'createDirectory', type: 'boolean', required: false },
    { name: 'overwrite', type: 'boolean', required: false },
    { name: 'append', type: 'boolean', required: false },
    { name: 'mode', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for writeFile', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    path: filePath,
    content,
    encoding = 'utf8',
    createDirectory = false,
    overwrite = true,
    append = false,
    mode = 0o666,
  } = params as WriteFileParams;

  const pathValidation = sanitizePath(filePath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: filePath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    const directory = path.dirname(sanitizedPath);

    logger.debug('Writing file', { path: sanitizedPath, encoding, append });

    const exists = await pathExists(sanitizedPath);
    if (exists && !overwrite && !append) {
      return createErrorResponse(
        id,
        ErrorCode.InvalidParams,
        'File already exists and overwrite is disabled'
      );
    }

    if (createDirectory) {
      await fs.mkdir(directory, { recursive: true });
    }

    let buffer: Buffer;
    if (encoding === 'base64') {
      buffer = Buffer.from(content, 'base64');
    } else if (encoding === 'binary') {
      buffer = Buffer.from(content, 'binary');
    } else {
      buffer = Buffer.from(content, 'utf8');
    }

    if (append) {
      await fs.appendFile(sanitizedPath, buffer, { mode });
    } else {
      await fs.writeFile(sanitizedPath, buffer, { mode });
    }

    const stats = await fs.stat(sanitizedPath);

    logger.info('File written successfully', {
      path: sanitizedPath,
      size: stats.size,
      append,
    });

    return createSuccessResponse(id, {
      path: sanitizedPath,
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    logger.error('Failed to write file', { path: filePath, error: err.message });

    if (err.code === 'ENOENT') {
      return createErrorResponse(
        id,
        ErrorCode.InvalidParams,
        'Directory does not exist. Set createDirectory to true.'
      );
    }
    if (err.code === 'EACCES') {
      return createErrorResponse(id, ErrorCode.Forbidden, 'Permission denied');
    }

    return createErrorResponse(id, ErrorCode.InternalError, `Failed to write file: ${err.message}`);
  }
}

export async function handleDeleteFile(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'recursive', type: 'boolean', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for deleteFile', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { path: filePath, recursive = false } = params as { path: string; recursive?: boolean };

  const pathValidation = sanitizePath(filePath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: filePath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    logger.debug('Deleting file', { path: sanitizedPath, recursive });

    const stats = await fs.stat(sanitizedPath);

    if (stats.isDirectory()) {
      if (!recursive) {
        return createErrorResponse(
          id,
          ErrorCode.InvalidParams,
          'Cannot delete directory. Set recursive to true.'
        );
      }
      await fs.rm(sanitizedPath, { recursive: true, force: true });
    } else {
      await fs.unlink(sanitizedPath);
    }

    logger.info('File deleted successfully', { path: sanitizedPath });

    return createSuccessResponse(id, {
      deleted: true,
      path: sanitizedPath,
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    logger.error('Failed to delete file', { path: filePath, error: err.message });

    if (err.code === 'ENOENT') {
      return createErrorResponse(id, ErrorCode.NotFound, 'File not found');
    }
    if (err.code === 'EACCES') {
      return createErrorResponse(id, ErrorCode.Forbidden, 'Permission denied');
    }

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Failed to delete file: ${err.message}`
    );
  }
}
