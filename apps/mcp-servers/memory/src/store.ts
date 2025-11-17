/**
 * Memory Store - In-memory key-value store with persistence
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { MemoryEntry, MemoryStats } from '../../shared/types.js';

export class MemoryStore {
  private store: Map<string, MemoryEntry>;
  private persistPath?: string;
  private autoSaveInterval?: NodeJS.Timeout;
  private isDirty: boolean = false;

  constructor(persistPath?: string, autoSaveMs?: number) {
    this.store = new Map();
    this.persistPath = persistPath;

    if (autoSaveMs && persistPath) {
      this.autoSaveInterval = setInterval(() => {
        if (this.isDirty) {
          this.persist().catch((error) => {
            console.error('Auto-save failed:', error);
          });
        }
      }, autoSaveMs);
    }
  }

  async initialize(): Promise<void> {
    if (this.persistPath) {
      try {
        await this.load();
      } catch (error) {
        console.warn('Failed to load persisted data:', error);
      }
    }
  }

  async get(key: string): Promise<MemoryEntry | undefined> {
    return this.store.get(key);
  }

  async set(key: string, entry: MemoryEntry): Promise<void> {
    this.store.set(key, entry);
    this.isDirty = true;
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async delete(key: string): Promise<boolean> {
    const result = this.store.delete(key);
    if (result) {
      this.isDirty = true;
    }
    return result;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.isDirty = true;
  }

  async size(): Promise<number> {
    return this.store.size;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async values(): Promise<MemoryEntry[]> {
    return Array.from(this.store.values());
  }

  async entries(): Promise<Array<[string, MemoryEntry]>> {
    return Array.from(this.store.entries());
  }

  async getStats(): Promise<MemoryStats> {
    const entries = Array.from(this.store.entries());

    const byType: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    let oldestEntry: string | undefined;
    let newestEntry: string | undefined;
    let oldestTime = Infinity;
    let newestTime = 0;
    let totalSize = 0;

    for (const [key, entry] of entries) {
      const valueSize = JSON.stringify(entry.value).length;
      totalSize += valueSize;

      if (entry.metadata) {
        if (entry.metadata.type) {
          byType[entry.metadata.type] = (byType[entry.metadata.type] || 0) + 1;
        }

        for (const tag of entry.metadata.tags || []) {
          byTag[tag] = (byTag[tag] || 0) + 1;
        }

        const createdTime = new Date(entry.metadata.created).getTime();
        if (createdTime < oldestTime) {
          oldestTime = createdTime;
          oldestEntry = entry.metadata.created;
        }
        if (createdTime > newestTime) {
          newestTime = createdTime;
          newestEntry = entry.metadata.created;
        }
      }
    }

    return {
      totalEntries: this.store.size,
      totalSize,
      byType,
      byTag,
      oldestEntry,
      newestEntry,
    };
  }

  async persist(): Promise<void> {
    if (!this.persistPath) {
      return;
    }

    try {
      const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        entries: Array.from(this.store.entries()),
      };

      const dir = path.dirname(this.persistPath);
      await fs.mkdir(dir, { recursive: true });

      const tempPath = `${this.persistPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2));

      await fs.rename(tempPath, this.persistPath);

      this.isDirty = false;
    } catch (error) {
      throw new Error(`Failed to persist data: ${(error as Error).message}`);
    }
  }

  async load(): Promise<void> {
    if (!this.persistPath) {
      return;
    }

    try {
      const content = await fs.readFile(this.persistPath, 'utf8');
      const data = JSON.parse(content);

      if (data.version !== 1) {
        throw new Error(`Unsupported data version: ${data.version}`);
      }

      this.store.clear();
      for (const [key, entry] of data.entries) {
        this.store.set(key, entry);
      }

      this.isDirty = false;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to load data: ${(error as Error).message}`);
      }
    }
  }

  async backup(backupPath: string): Promise<void> {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      entries: Array.from(this.store.entries()),
    };

    const dir = path.dirname(backupPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
  }

  async restore(backupPath: string): Promise<void> {
    const content = await fs.readFile(backupPath, 'utf8');
    const data = JSON.parse(content);

    if (data.version !== 1) {
      throw new Error(`Unsupported backup version: ${data.version}`);
    }

    this.store.clear();
    for (const [key, entry] of data.entries) {
      this.store.set(key, entry);
    }

    this.isDirty = true;
  }

  async shutdown(): Promise<void> {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    if (this.isDirty && this.persistPath) {
      await this.persist();
    }
  }
}
