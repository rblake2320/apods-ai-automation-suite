import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { ApiError } from './ApiError';
import logger from './logger';

/**
 * File utility functions for file system operations
 */

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param dirPath - Path to the directory
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
}

/**
 * Checks if a file or directory exists
 * @param filePath - Path to check
 * @returns True if exists, false otherwise
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Reads a JSON file and parses it
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON data
 */
export async function readJSON<T = any>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw ApiError.notFound(`File not found: ${filePath}`);
    }
    throw ApiError.internal(`Failed to read JSON file: ${filePath}`);
  }
}

/**
 * Writes data to a JSON file
 * @param filePath - Path to the JSON file
 * @param data - Data to write
 * @param pretty - Whether to format the JSON (default: true)
 */
export async function writeJSON(filePath: string, data: any, pretty = true): Promise<void> {
  try {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    logger.info(`Wrote JSON file: ${filePath}`);
  } catch (error) {
    throw ApiError.internal(`Failed to write JSON file: ${filePath}`);
  }
}

/**
 * Reads a text file
 * @param filePath - Path to the file
 * @returns File content as string
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw ApiError.notFound(`File not found: ${filePath}`);
    }
    throw ApiError.internal(`Failed to read file: ${filePath}`);
  }
}

/**
 * Writes content to a text file
 * @param filePath - Path to the file
 * @param content - Content to write
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    logger.info(`Wrote file: ${filePath}`);
  } catch (error) {
    throw ApiError.internal(`Failed to write file: ${filePath}`);
  }
}

/**
 * Deletes a file
 * @param filePath - Path to the file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    logger.info(`Deleted file: ${filePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw ApiError.notFound(`File not found: ${filePath}`);
    }
    throw ApiError.internal(`Failed to delete file: ${filePath}`);
  }
}

/**
 * Copies a file from source to destination
 * @param src - Source file path
 * @param dest - Destination file path
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  try {
    await ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
    logger.info(`Copied file from ${src} to ${dest}`);
  } catch (error) {
    throw ApiError.internal(`Failed to copy file: ${src} to ${dest}`);
  }
}

/**
 * Moves a file from source to destination
 * @param src - Source file path
 * @param dest - Destination file path
 */
export async function moveFile(src: string, dest: string): Promise<void> {
  try {
    await ensureDir(path.dirname(dest));
    await fs.rename(src, dest);
    logger.info(`Moved file from ${src} to ${dest}`);
  } catch (error) {
    throw ApiError.internal(`Failed to move file: ${src} to ${dest}`);
  }
}

/**
 * Lists files in a directory
 * @param dirPath - Directory path
 * @param options - Options for filtering
 * @returns Array of file names
 */
export async function listFiles(
  dirPath: string,
  options: {
    extension?: string;
    recursive?: boolean;
  } = {}
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && options.recursive) {
        const subFiles = await listFiles(fullPath, options);
        files.push(...subFiles.map((f) => path.join(entry.name, f)));
      } else if (entry.isFile()) {
        if (!options.extension || entry.name.endsWith(options.extension)) {
          files.push(entry.name);
        }
      }
    }

    return files;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw ApiError.notFound(`Directory not found: ${dirPath}`);
    }
    throw ApiError.internal(`Failed to list files in: ${dirPath}`);
  }
}

/**
 * Gets file stats
 * @param filePath - Path to the file
 * @returns File stats
 */
export async function getFileStats(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw ApiError.notFound(`File not found: ${filePath}`);
    }
    throw ApiError.internal(`Failed to get file stats: ${filePath}`);
  }
}

/**
 * Sanitizes a filename by removing invalid characters
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Gets file extension
 * @param filename - Filename
 * @returns Extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const ext = path.extname(filename);
  return ext ? ext.substring(1) : '';
}

/**
 * Streams a file to a destination
 * @param src - Source file path
 * @param dest - Destination file path
 */
export async function streamFile(src: string, dest: string): Promise<void> {
  try {
    await ensureDir(path.dirname(dest));
    const readStream = createReadStream(src);
    const writeStream = createWriteStream(dest);
    await pipeline(readStream, writeStream);
    logger.info(`Streamed file from ${src} to ${dest}`);
  } catch (error) {
    throw ApiError.internal(`Failed to stream file: ${src} to ${dest}`);
  }
}

/**
 * Deletes a directory recursively
 * @param dirPath - Directory path
 */
export async function deleteDirectory(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    logger.info(`Deleted directory: ${dirPath}`);
  } catch (error) {
    throw ApiError.internal(`Failed to delete directory: ${dirPath}`);
  }
}
