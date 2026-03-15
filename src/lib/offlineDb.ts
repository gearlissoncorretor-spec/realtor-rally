import { openDB, type IDBPDatabase } from 'idb';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export type OfflineRecordType = 
  | 'sales' 
  | 'negotiations' 
  | 'follow_ups' 
  | 'calendar_events' 
  | 'broker_activities';

export interface OfflineRecord {
  id_local: string;
  tipo_registro: OfflineRecordType;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  dados: Record<string, any>;
  data_criacao: string;
  ultima_atualizacao: string;
  status_sync: SyncStatus;
  error_message?: string;
  retry_count: number;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  tipo_registro: OfflineRecordType;
  action: string;
  status: 'success' | 'error';
  message: string;
}

const DB_NAME = 'axis_offline_db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

export const getOfflineDb = async () => {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Offline queue store
      if (!db.objectStoreNames.contains('offline_queue')) {
        const store = db.createObjectStore('offline_queue', { keyPath: 'id_local' });
        store.createIndex('by_status', 'status_sync');
        store.createIndex('by_type', 'tipo_registro');
        store.createIndex('by_date', 'data_criacao');
      }
      
      // Sync logs store
      if (!db.objectStoreNames.contains('sync_logs')) {
        const store = db.createObjectStore('sync_logs', { keyPath: 'id' });
        store.createIndex('by_timestamp', 'timestamp');
      }
    },
  });
  
  return dbInstance;
};

// ---- Queue operations ----

export const addToOfflineQueue = async (record: OfflineRecord): Promise<void> => {
  const db = await getOfflineDb();
  await db.put('offline_queue', record);
};

export const getPendingRecords = async (): Promise<OfflineRecord[]> => {
  const db = await getOfflineDb();
  const all = await db.getAllFromIndex('offline_queue', 'by_status', 'pending');
  // Also get error records for retry
  const errors = await db.getAllFromIndex('offline_queue', 'by_status', 'error');
  return [...all, ...errors].sort(
    (a, b) => new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime()
  );
};

export const getPendingCount = async (): Promise<number> => {
  const db = await getOfflineDb();
  const pending = await db.countFromIndex('offline_queue', 'by_status', 'pending');
  const error = await db.countFromIndex('offline_queue', 'by_status', 'error');
  return pending + error;
};

export const updateRecordStatus = async (
  id_local: string, 
  status: SyncStatus, 
  errorMessage?: string
): Promise<void> => {
  const db = await getOfflineDb();
  const record = await db.get('offline_queue', id_local);
  if (record) {
    record.status_sync = status;
    record.ultima_atualizacao = new Date().toISOString();
    if (errorMessage) record.error_message = errorMessage;
    if (status === 'error') record.retry_count = (record.retry_count || 0) + 1;
    await db.put('offline_queue', record);
  }
};

export const removeSyncedRecords = async (): Promise<void> => {
  const db = await getOfflineDb();
  const synced = await db.getAllFromIndex('offline_queue', 'by_status', 'synced');
  const tx = db.transaction('offline_queue', 'readwrite');
  for (const record of synced) {
    await tx.store.delete(record.id_local);
  }
  await tx.done;
};

// ---- Sync logs ----

export const addSyncLog = async (log: SyncLog): Promise<void> => {
  const db = await getOfflineDb();
  await db.put('sync_logs', log);
  
  // Keep only last 100 logs
  const allLogs = await db.getAllFromIndex('sync_logs', 'by_timestamp');
  if (allLogs.length > 100) {
    const tx = db.transaction('sync_logs', 'readwrite');
    const toDelete = allLogs.slice(0, allLogs.length - 100);
    for (const log of toDelete) {
      await tx.store.delete(log.id);
    }
    await tx.done;
  }
};

export const getSyncLogs = async (limit = 20): Promise<SyncLog[]> => {
  const db = await getOfflineDb();
  const all = await db.getAllFromIndex('sync_logs', 'by_timestamp');
  return all.slice(-limit).reverse();
};
