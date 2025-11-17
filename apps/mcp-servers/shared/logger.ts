/**
 * MCP Logger - Structured logging for MCP servers
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { LogEntry } from './types.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  serverName: string;
  logToFile?: boolean;
  logDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  pretty?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

export class Logger {
  private config: Required<LoggerConfig>;
  private currentLogFile?: string;
  private currentLogSize: number = 0;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level,
      serverName: config.serverName,
      logToFile: config.logToFile ?? false,
      logDir: config.logDir ?? './logs',
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles ?? 5,
      pretty: config.pretty ?? process.env.NODE_ENV !== 'production',
    };

    if (this.config.logToFile) {
      this.initializeLogFile();
    }
  }

  private async initializeLogFile(): Promise<void> {
    try {
      await fs.mkdir(this.config.logDir, { recursive: true });
      this.currentLogFile = path.join(
        this.config.logDir,
        `${this.config.serverName}-${new Date().toISOString().split('T')[0]}.log`
      );
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();

    if (this.config.pretty) {
      const levelColors: Record<LogLevel, string> = {
        debug: COLORS.cyan,
        info: COLORS.green,
        warn: COLORS.yellow,
        error: COLORS.red,
      };

      const color = levelColors[entry.level];
      const levelStr = entry.level.toUpperCase().padEnd(5);

      let message = `${COLORS.dim}${timestamp}${COLORS.reset} ${color}${levelStr}${COLORS.reset} ${COLORS.bright}[${this.config.serverName}]${COLORS.reset} ${entry.message}`;

      if (entry.requestId) {
        message += ` ${COLORS.dim}(${entry.requestId})${COLORS.reset}`;
      }

      if (entry.context && Object.keys(entry.context).length > 0) {
        message += `\n${COLORS.dim}${JSON.stringify(entry.context, null, 2)}${COLORS.reset}`;
      }

      return message;
    } else {
      return JSON.stringify(entry);
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.logToFile || !this.currentLogFile) {
      return;
    }

    const message = JSON.stringify(entry) + '\n';
    const messageSize = Buffer.byteLength(message);

    this.writeQueue = this.writeQueue.then(async () => {
      try {
        if (this.currentLogSize + messageSize > this.config.maxFileSize) {
          await this.rotateLogFile();
        }

        await fs.appendFile(this.currentLogFile!, message);
        this.currentLogSize += messageSize;
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    });

    await this.writeQueue;
  }

  private async rotateLogFile(): Promise<void> {
    if (!this.currentLogFile) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);

    try {
      await fs.rename(this.currentLogFile, rotatedFile);
      this.currentLogSize = 0;

      await this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDir);
      const logFiles = files
        .filter((file) => file.startsWith(this.config.serverName) && file.endsWith('.log'))
        .map((file) => path.join(this.config.logDir, file));

      if (logFiles.length > this.config.maxFiles) {
        const stats = await Promise.all(
          logFiles.map(async (file) => ({
            file,
            mtime: (await fs.stat(file)).mtime,
          }))
        );

        stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

        const filesToDelete = stats.slice(this.config.maxFiles);
        await Promise.all(filesToDelete.map((f) => fs.unlink(f.file)));
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    requestId?: string
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      requestId,
    };

    const formatted = this.formatMessage(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    if (this.config.logToFile) {
      this.writeToFile(entry);
    }
  }

  debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log('debug', message, context, requestId);
  }

  info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log('info', message, context, requestId);
  }

  warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log('warn', message, context, requestId);
  }

  error(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log('error', message, context, requestId);
  }

  child(additionalContext: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, additionalContext);
  }

  async flush(): Promise<void> {
    await this.writeQueue;
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private additionalContext: Record<string, unknown>
  ) {}

  private mergeContext(context?: Record<string, unknown>): Record<string, unknown> {
    return { ...this.additionalContext, ...context };
  }

  debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.parent.debug(message, this.mergeContext(context), requestId);
  }

  info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.parent.info(message, this.mergeContext(context), requestId);
  }

  warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.parent.warn(message, this.mergeContext(context), requestId);
  }

  error(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.parent.error(message, this.mergeContext(context), requestId);
  }
}

export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}
