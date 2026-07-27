import { openDB, deleteDB, IDBPDatabase } from 'idb'
import { LogEntry } from './LoggerService'

const DB_NAME = 'mini_logs_db'
const STORE_NAME = 'log_chunks'
const DB_VERSION = 1
const MAX_LOG_BYTES = 1024 * 1024 // 1 MB strict storage limit

export interface LogChunkRecord {
  id: number
  sizeBytes: number
  logs: LogEntry[]
}

class LogDbService {
  private db: IDBPDatabase | null = null

  async open(): Promise<IDBPDatabase> {
    if (this.db) return this.db

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db: any) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          }
        }
      })
      return this.db
    } catch (err: any) {
      if (
        err?.name === 'VersionError' ||
        String(err?.message || '').includes('less than the existing version')
      ) {
        console.warn(`[LogDbService] Version mismatch detected (${err.message}). Purging stale database...`)
        await deleteDB(DB_NAME)
        this.db = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db: any) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
          }
        })
        return this.db
      }
      throw err
    }
  }

  private getByteSize(obj: any): number {
    return new TextEncoder().encode(JSON.stringify(obj)).length
  }

  /**
   * Save a chunk of log entries to IndexedDB and automatically remove old chunks if >1MB.
   */
  async saveChunk(logs: LogEntry[]): Promise<void> {
    if (!logs || logs.length === 0) return
    try {
      const db = await this.open()
      const chunkId = Date.now()
      const sizeBytes = this.getByteSize(logs)

      const record: LogChunkRecord = {
        id: chunkId,
        sizeBytes,
        logs
      }

      await db.put(STORE_NAME, record)
      await this.enforceQuota(db)
    } catch (e) {
      console.warn('LogDbService: Failed to save log chunk', e)
    }
  }

  /**
   * Read all log chunks from IndexedDB ordered chronologically.
   */
  async getAllLogs(): Promise<LogEntry[]> {
    try {
      const db = await this.open()
      const records = (await db.getAll(STORE_NAME)) as LogChunkRecord[]
      records.sort((a, b) => a.id - b.id)
      const allLogs: LogEntry[] = []
      for (const r of records) {
        if (Array.isArray(r.logs)) {
          allLogs.push(...r.logs)
        }
      }
      return allLogs
    } catch (e) {
      console.warn('LogDbService: Failed to retrieve stored logs', e)
      return []
    }
  }

  /**
   * Returns total storage size used by stored log chunks in bytes.
   */
  async getStorageSize(): Promise<number> {
    try {
      const db = await this.open()
      const records = (await db.getAll(STORE_NAME)) as LogChunkRecord[]
      return records.reduce((sum, r) => sum + (r.sizeBytes || 0), 0)
    } catch {
      return 0
    }
  }

  /**
   * Enforces 1MB quota by removing oldest chunks until size <= 1MB.
   */
  private async enforceQuota(db: IDBPDatabase): Promise<void> {
    const records = (await db.getAll(STORE_NAME)) as LogChunkRecord[]
    let totalBytes = records.reduce((sum, r) => sum + (r.sizeBytes || 0), 0)

    if (totalBytes <= MAX_LOG_BYTES) return

    // Sort by chunk ID ascending (oldest first)
    records.sort((a, b) => a.id - b.id)

    for (const record of records) {
      if (totalBytes <= MAX_LOG_BYTES) break
      await db.delete(STORE_NAME, record.id)
      totalBytes -= record.sizeBytes
    }
  }

  /**
   * Clears all log chunks from IndexedDB.
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.open()
      await db.clear(STORE_NAME)
    } catch (e) {
      console.warn('LogDbService: Failed to clear log database', e)
    }
  }
}

export const logDbService = new LogDbService()
