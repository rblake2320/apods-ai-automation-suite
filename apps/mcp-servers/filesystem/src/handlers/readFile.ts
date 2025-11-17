/**
 * Read File Handler - Handles file reading operations
 */

import * as fs from 'fs/promises';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
  sanitizePath,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, FileMetadata } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export interface ReadFileParams {
  path: string;
  encoding?: 'utf8' | 'base64' | 'binary';
  offset?: number;
  length?: number;
}

export async function handleReadFile(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'encoding', type: 'string', required: false },
    { name: 'offset', type: 'number', required: false },
    { name: 'length', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for readFile', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { path: filePath, encoding = 'utf8', offset, length } = params as ReadFileParams;

  const pathValidation = sanitizePath(filePath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: filePath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    logger.debug('Reading file', { path: sanitizedPath, encoding });

    const stats = await fs.stat(sanitizedPath);

    if (stats.isDirectory()) {
      return createErrorResponse(id, ErrorCode.InvalidParams, 'Cannot read a directory as a file');
    }

    let content: string | Buffer;

    if (offset !== undefined || length !== undefined) {
      const fileHandle = await fs.open(sanitizedPath, 'r');
      try {
        const buffer = Buffer.alloc(length || stats.size - (offset || 0));
        await fileHandle.read(buffer, 0, buffer.length, offset || 0);
        content = buffer;
      } finally {
        await fileHandle.close();
      }
    } else {
      content = await fs.readFile(sanitizedPath);
    }

    let result: string;
    if (encoding === 'utf8') {
      result = content.toString('utf8');
    } else if (encoding === 'base64') {
      result = Buffer.isBuffer(content)
        ? content.toString('base64')
        : Buffer.from(content).toString('base64');
    } else {
      result = Buffer.isBuffer(content)
        ? content.toString('binary')
        : Buffer.from(content).toString('binary');
    }

    const metadata: FileMetadata = {
      path: sanitizedPath,
      name: sanitizedPath.split('/').pop() || '',
      size: stats.size,
      isDirectory: false,
      isFile: true,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
    };

    logger.info('File read successfully', { path: sanitizedPath, size: stats.size });

    return createSuccessResponse(id, {
      content: result,
      metadata,
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    logger.error('Failed to read file', { path: filePath, error: err.message });

    if (err.code === 'ENOENT') {
      return createErrorResponse(id, ErrorCode.NotFound, 'File not found');
    }
    if (err.code === 'EACCES') {
      return createErrorResponse(id, ErrorCode.Forbidden, 'Permission denied');
    }

    return createErrorResponse(id, ErrorCode.InternalError, `Failed to read file: ${err.message}`);
  }
}
