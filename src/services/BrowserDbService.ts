import { openDB, deleteDB, IDBPDatabase } from 'idb'

const DB_NAME = 'mini_pages_db'
const STORE_NAME = 'encounters'
const DB_VERSION = 3
const MAX_CACHE_BYTES = 50 * 1024 * 1024

export interface CacheMetadata {
  encounterNo: string
  patientName: string
  cachedAt: string
  sizeBytes: number
}

interface EncounterRecord {
  id: string
  patientName: string
  cachedAt: string
  payload: ArrayBuffer
  sizeBytes: number
}

class BrowserDbService {
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
        console.warn(`[BrowserDbService] Version mismatch detected (${err.message}). Purging stale database...`)
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

  private async compress(str: string): Promise<ArrayBuffer> {
    const stream = new Blob([str]).stream()
    const cs = new CompressionStream('gzip')
    const blob = await new Response(stream.pipeThrough(cs)).blob()
    return blob.arrayBuffer()
  }

  private async decompress(buffer: ArrayBuffer): Promise<string> {
    const ds = new DecompressionStream('gzip')
    const stream = new Blob([buffer]).stream().pipeThrough(ds)
    return new Response(stream).text()
  }

  private async enforceQuota(db: IDBPDatabase, incomingSize: number): Promise<void> {
    const records = (await db.getAll(STORE_NAME)) as EncounterRecord[]
    let total = records.reduce((sum, r) => sum + r.sizeBytes, 0)

    if (total + incomingSize <= MAX_CACHE_BYTES) return

    records.sort((a, b) => new Date(a.cachedAt).getTime() - new Date(b.cachedAt).getTime())

    for (const r of records) {
      if (total + incomingSize <= MAX_CACHE_BYTES) break
      await db.delete(STORE_NAME, r.id)
      total -= r.sizeBytes
    }
  }

  async storeEncounter(encounterNo: string, patientName: string, data: any): Promise<number> {
    const db = await this.open()
    const jsonStr = JSON.stringify(data)
    const compressed = await this.compress(jsonStr)
    const sizeBytes = compressed.byteLength

    await this.enforceQuota(db, sizeBytes)

    const record: EncounterRecord = {
      id: encounterNo.toUpperCase().trim(),
      patientName,
      cachedAt: new Date().toISOString(),
      payload: compressed,
      sizeBytes
    }

    await db.put(STORE_NAME, record)
    return sizeBytes
  }

  async getEncounter(encounterNo: string): Promise<{ data: any; cachedAt: string; sizeBytes: number } | null> {
    const db = await this.open()
    const key = encounterNo.toUpperCase().trim()
    const record = (await db.get(STORE_NAME, key)) as EncounterRecord | undefined

    if (!record?.payload) return null

    try {
      const jsonStr = await this.decompress(record.payload)
      return {
        data: JSON.parse(jsonStr),
        cachedAt: record.cachedAt,
        sizeBytes: record.sizeBytes
      }
    } catch (e: any) {
      throw new Error(`Decompress failed: ${e.message}`)
    }
  }

  async listCached(): Promise<CacheMetadata[]> {
    const db = await this.open()
    const records = (await db.getAll(STORE_NAME)) as EncounterRecord[]
    return records.map((r) => ({
      encounterNo: r.id,
      patientName: r.patientName || 'Unknown Patient',
      cachedAt: r.cachedAt,
      sizeBytes: r.sizeBytes
    }))
  }

  async removeEncounter(encounterNo: string): Promise<void> {
    const db = await this.open()
    const key = encounterNo.toUpperCase().trim()
    await db.delete(STORE_NAME, key)
  }

  async clearAll(): Promise<void> {
    const db = await this.open()
    await db.clear(STORE_NAME)
  }
}

export const dbService = new BrowserDbService()
