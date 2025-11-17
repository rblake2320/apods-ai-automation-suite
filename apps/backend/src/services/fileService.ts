import {
  ensureDir,
  exists,
  readJSON,
  writeJSON,
  readFile,
  writeFile,
  deleteFile,
  copyFile,
  moveFile,
  listFiles,
  getFileStats,
  sanitizeFilename,
  getFileExtension,
} from '../utils/fileUtils';
import { ApiError } from '../utils/ApiError';
import { FileUploadInfo } from '../types';
import logger from '../utils/logger';
import path from 'path';
import { env } from '../config/env';

/**
 * File Service
 * Handles file system operations
 */
export class FileService {
  private static uploadDir = env.UPLOAD_DIR;

  /**
   * Initializes the file service
   * Creates necessary directories
   */
  static async initialize(): Promise<void> {
    await ensureDir(this.uploadDir);
    logger.info(`File service initialized. Upload directory: ${this.uploadDir}`);
  }

  /**
   * Saves an uploaded file
   * @param file - File buffer
   * @param originalName - Original filename
   * @param userId - User ID (for organizing files)
   * @returns File upload information
   */
  static async saveUploadedFile(
    file: Buffer,
    originalName: string,
    userId: string
  ): Promise<FileUploadInfo> {
    try {
      // Sanitize filename
      const sanitized = sanitizeFilename(originalName);
      const extension = getFileExtension(sanitized);

      // Create unique filename
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}${extension ? `.${extension}` : ''}`;

      // Create user directory
      const userDir = path.join(this.uploadDir, userId);
      await ensureDir(userDir);

      // Save file
      const filePath = path.join(userDir, filename);
      await writeFile(filePath, file.toString());

      logger.info(`File saved: ${filePath}`);

      return {
        filename,
        originalname: originalName,
        mimetype: this.getMimeType(extension),
        size: file.length,
        path: filePath,
        uploadedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('File save failed:', error);
      throw ApiError.internal(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Gets a file by path
   * @param filePath - File path
   * @param userId - User ID (for authorization)
   * @returns File content
   */
  static async getFile(filePath: string, userId: string): Promise<string> {
    // Check if file belongs to user
    if (!filePath.includes(userId)) {
      throw ApiError.forbidden('You do not have permission to access this file');
    }

    const fileExists = await exists(filePath);
    if (!fileExists) {
      throw ApiError.notFound('File not found');
    }

    return readFile(filePath);
  }

  /**
   * Deletes a file
   * @param filePath - File path
   * @param userId - User ID (for authorization)
   */
  static async deleteFile(filePath: string, userId: string): Promise<void> {
    // Check if file belongs to user
    if (!filePath.includes(userId)) {
      throw ApiError.forbidden('You do not have permission to delete this file');
    }

    await deleteFile(filePath);
    logger.info(`File deleted: ${filePath}`);
  }

  /**
   * Lists files for a user
   * @param userId - User ID
   * @param options - Listing options
   * @returns List of files
   */
  static async listUserFiles(
    userId: string,
    options: {
      extension?: string;
      recursive?: boolean;
    } = {}
  ): Promise<string[]> {
    const userDir = path.join(this.uploadDir, userId);

    const dirExists = await exists(userDir);
    if (!dirExists) {
      return [];
    }

    return listFiles(userDir, options);
  }

  /**
   * Gets file information
   * @param filePath - File path
   * @param userId - User ID (for authorization)
   * @returns File information
   */
  static async getFileInfo(
    filePath: string,
    userId: string
  ): Promise<{
    name: string;
    path: string;
    size: number;
    extension: string;
    createdAt: Date;
    modifiedAt: Date;
  }> {
    // Check if file belongs to user
    if (!filePath.includes(userId)) {
      throw ApiError.forbidden('You do not have permission to access this file');
    }

    const stats = await getFileStats(filePath);
    const name = path.basename(filePath);
    const extension = getFileExtension(name);

    return {
      name,
      path: filePath,
      size: stats.size,
      extension,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  }

  /**
   * Copies a file
   * @param sourcePath - Source file path
   * @param destPath - Destination file path
   * @param userId - User ID (for authorization)
   */
  static async copyFile(sourcePath: string, destPath: string, userId: string): Promise<void> {
    // Check if source file belongs to user
    if (!sourcePath.includes(userId)) {
      throw ApiError.forbidden('You do not have permission to access this file');
    }

    // Ensure destination is in user's directory
    if (!destPath.includes(userId)) {
      throw ApiError.forbidden('Invalid destination path');
    }

    await copyFile(sourcePath, destPath);
    logger.info(`File copied from ${sourcePath} to ${destPath}`);
  }

  /**
   * Moves a file
   * @param sourcePath - Source file path
   * @param destPath - Destination file path
   * @param userId - User ID (for authorization)
   */
  static async moveFile(sourcePath: string, destPath: string, userId: string): Promise<void> {
    // Check if source file belongs to user
    if (!sourcePath.includes(userId)) {
      throw ApiError.forbidden('You do not have permission to access this file');
    }

    // Ensure destination is in user's directory
    if (!destPath.includes(userId)) {
      throw ApiError.forbidden('Invalid destination path');
    }

    await moveFile(sourcePath, destPath);
    logger.info(`File moved from ${sourcePath} to ${destPath}`);
  }

  /**
   * Saves JSON data to a file
   * @param data - Data to save
   * @param filename - Filename
   * @param userId - User ID
   * @returns File path
   */
  static async saveJSON(data: any, filename: string, userId: string): Promise<string> {
    const sanitized = sanitizeFilename(filename);
    const userDir = path.join(this.uploadDir, userId);
    await ensureDir(userDir);

    const filePath = path.join(userDir, sanitized);
    await writeJSON(filePath, data);

    logger.info(`JSON file saved: ${filePath}`);

    return filePath;
  }

  /**
   * Reads JSON data from a file
   * @param filePath - File path
   * @param userId - User ID (for authorization)
   * @returns Parsed JSON data
   */
  static async readJSON<T = any>(filePath: string, userId: string): Promise<T> {
    // Check if file belongs to user
    if (!filePath.includes(userId)) {
      throw ApiError.forbidden('You do not have permission to access this file');
    }

    return readJSON<T>(filePath);
  }

  /**
   * Gets MIME type based on file extension
   * @param extension - File extension
   * @returns MIME type
   */
  private static getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      ts: 'application/typescript',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      zip: 'application/zip',
      csv: 'text/csv',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}
