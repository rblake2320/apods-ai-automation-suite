/**
 * Search Handler - Handles file search operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
  sanitizePath,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, SearchOptions, SearchResult } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export async function handleSearch(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'pattern', type: 'string', required: true },
    { name: 'caseSensitive', type: 'boolean', required: false },
    { name: 'regex', type: 'boolean', required: false },
    { name: 'maxResults', type: 'number', required: false },
    { name: 'includeHidden', type: 'boolean', required: false },
    { name: 'fileTypes', type: 'object', required: false },
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

  const {
    path: searchPath,
    pattern,
    caseSensitive = false,
    regex = false,
    maxResults = 1000,
    includeHidden = false,
    fileTypes = [],
  } = params as SearchOptions & { path: string };

  const pathValidation = sanitizePath(searchPath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: searchPath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    logger.debug('Searching files', {
      path: sanitizedPath,
      pattern,
      caseSensitive,
      regex,
    });

    const stats = await fs.stat(sanitizedPath);

    if (!stats.isDirectory()) {
      return createErrorResponse(id, ErrorCode.InvalidParams, 'Search path must be a directory');
    }

    const searchRegex = createSearchRegex(pattern, regex, caseSensitive);
    const results: SearchResult[] = [];

    await searchDirectory(
      sanitizedPath,
      searchRegex,
      results,
      maxResults,
      includeHidden,
      fileTypes
    );

    logger.info('Search completed', {
      path: sanitizedPath,
      resultCount: results.length,
    });

    return createSuccessResponse(id, {
      results,
      count: results.length,
      truncated: results.length >= maxResults,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Search failed', { path: searchPath, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Search failed: ${err.message}`);
  }
}

function createSearchRegex(pattern: string, isRegex: boolean, caseSensitive: boolean): RegExp {
  if (isRegex) {
    return new RegExp(pattern, caseSensitive ? 'g' : 'gi');
  } else {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, caseSensitive ? 'g' : 'gi');
  }
}

async function searchDirectory(
  dirPath: string,
  searchRegex: RegExp,
  results: SearchResult[],
  maxResults: number,
  includeHidden: boolean,
  fileTypes: string[]
): Promise<void> {
  if (results.length >= maxResults) {
    return;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= maxResults) {
        break;
      }

      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          await searchDirectory(
            fullPath,
            searchRegex,
            results,
            maxResults,
            includeHidden,
            fileTypes
          );
        } else if (entry.isFile()) {
          if (fileTypes.length > 0) {
            const ext = path.extname(entry.name).toLowerCase();
            if (!fileTypes.includes(ext)) {
              continue;
            }
          }

          await searchInFile(fullPath, searchRegex, results, maxResults);
        }
      } catch (error) {
        // Skip files/directories that can't be accessed
        continue;
      }
    }
  } catch (error) {
    // Skip directories that can't be read
    return;
  }
}

async function searchInFile(
  filePath: string,
  searchRegex: RegExp,
  results: SearchResult[],
  maxResults: number
): Promise<void> {
  if (results.length >= maxResults) {
    return;
  }

  try {
    const stats = await fs.stat(filePath);

    // Skip large files (> 10MB)
    if (stats.size > 10 * 1024 * 1024) {
      return;
    }

    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (results.length >= maxResults) {
        break;
      }

      const line = lines[i];
      const matches = line.matchAll(searchRegex);

      for (const match of matches) {
        if (results.length >= maxResults) {
          break;
        }

        const contextStart = Math.max(0, i - 2);
        const contextEnd = Math.min(lines.length, i + 3);
        const context = lines.slice(contextStart, contextEnd).join('\n');

        results.push({
          path: filePath,
          line: i + 1,
          column: match.index !== undefined ? match.index + 1 : undefined,
          match: match[0],
          context,
        });
      }
    }
  } catch (error) {
    // Skip binary files or files that can't be read as text
    return;
  }
}

export async function handleFindFiles(
  id: string | number,
  params: Record<string, unknown>,
  allowedDirectories: string[],
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: true },
    { name: 'pattern', type: 'string', required: true },
    { name: 'maxResults', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for findFiles', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    path: searchPath,
    pattern,
    maxResults = 1000,
  } = params as { path: string; pattern: string; maxResults?: number };

  const pathValidation = sanitizePath(searchPath, allowedDirectories);
  if (!pathValidation.valid) {
    logger.warn('Path validation failed', { path: searchPath, error: pathValidation.error });
    return createErrorResponse(id, ErrorCode.Forbidden, pathValidation.error || 'Invalid path');
  }

  try {
    const sanitizedPath = pathValidation.sanitized!;
    logger.debug('Finding files', { path: sanitizedPath, pattern });

    const nameRegex = new RegExp(pattern);
    const files: string[] = [];

    await findFilesRecursive(sanitizedPath, nameRegex, files, maxResults);

    logger.info('Find files completed', {
      path: sanitizedPath,
      fileCount: files.length,
    });

    return createSuccessResponse(id, {
      files,
      count: files.length,
      truncated: files.length >= maxResults,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Find files failed', { path: searchPath, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Find files failed: ${err.message}`);
  }
}

async function findFilesRecursive(
  dirPath: string,
  nameRegex: RegExp,
  files: string[],
  maxResults: number
): Promise<void> {
  if (files.length >= maxResults) {
    return;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= maxResults) {
        break;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (nameRegex.test(entry.name)) {
        files.push(fullPath);
      }

      if (entry.isDirectory()) {
        await findFilesRecursive(fullPath, nameRegex, files, maxResults);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
    return;
  }
}
