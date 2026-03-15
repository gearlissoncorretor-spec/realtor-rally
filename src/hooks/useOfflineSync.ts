import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';
import {
  type OfflineRecord,
  type OfflineRecordType,
  getPendingRecords,
  getPendingCount,
  updateRecordStatus,
  addToOfflineQueue,
  removeSyncedRecords,
  addSyncLog,
} from '@/lib/offlineDb';
import { toast } from 'sonner';

export type SyncState = 'idle' | 'syncing' | 'done' | 'error';

const TABLE_MAP: Record<OfflineRecordType, string> = {
  sales: 'sales',
  negotiations: 'negotiations',
  follow_ups: 'follow_ups',
  calendar_events: 'calendar_events',
  broker_activities: 'broker_activities',
};

const QUERY_KEY_MAP: Record<OfflineRecordType, string[]> = {
  sales: ['sales'],
  negotiations: ['negotiations'],
  follow_ups: ['follow-ups'],
  calendar_events: ['calendar-events'],
  broker_activities: ['broker-activities'],
};

export const useOfflineSync = () => {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  // Queue a record for offline sync
  const queueOfflineRecord = useCallback(async (
    type: OfflineRecordType,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, any>,
  ) => {
    const record: OfflineRecord = {
      id_local: crypto.randomUUID(),
      tipo_registro: type,
      action,
      dados: data,
      data_criacao: new Date().toISOString(),
      ultima_atualizacao: new Date().toISOString(),
      status_sync: 'pending',
      retry_count: 0,
    };
    await addToOfflineQueue(record);
    await refreshPendingCount();
    
    toast.success('Registro salvo offline', {
      description: 'Será sincronizado automaticamente quando a conexão voltar.',
      duration: 3000,
    });
    
    return record.id_local;
  }, [refreshPendingCount]);

  // Process a single record
  const processRecord = useCallback(async (record: OfflineRecord): Promise<boolean> => {
    const table = TABLE_MAP[record.tipo_registro];
    if (!table) return false;

    try {
      await updateRecordStatus(record.id_local, 'syncing');

      let error: any = null;

      if (record.action === 'INSERT') {
        const insertData = { ...record.dados };
        // Remove local-only fields
        delete insertData._offline_id;
        const result = await supabase.from(table).insert(insertData);
        error = result.error;
      } else if (record.action === 'UPDATE') {
        const { id, ...updateData } = record.dados;
        delete updateData._offline_id;
        const result = await supabase.from(table).update(updateData).eq('id', id);
        error = result.error;
      } else if (record.action === 'DELETE') {
        const result = await supabase.from(table).delete().eq('id', record.dados.id);
        error = result.error;
      }

      if (error) {
        // Check for duplicate (already exists) - treat as success
        if (error.code === '23505') {
          await updateRecordStatus(record.id_local, 'synced');
          await addSyncLog({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            tipo_registro: record.tipo_registro,
            action: record.action,
            status: 'success',
            message: 'Registro já existia no servidor (duplicata ignorada).',
          });
          return true;
        }
        throw error;
      }

      await updateRecordStatus(record.id_local, 'synced');
      await addSyncLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        tipo_registro: record.tipo_registro,
        action: record.action,
        status: 'success',
        message: `${record.tipo_registro} ${record.action.toLowerCase()} sincronizado com sucesso.`,
      });

      // Invalidate related queries
      const queryKeys = QUERY_KEY_MAP[record.tipo_registro];
      if (queryKeys) {
        queryClient.invalidateQueries({ queryKey: queryKeys });
      }

      return true;
    } catch (err: any) {
      console.error('Sync error for record:', record.id_local, err);
      await updateRecordStatus(record.id_local, 'error', err?.message || 'Erro desconhecido');
      await addSyncLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        tipo_registro: record.tipo_registro,
        action: record.action,
        status: 'error',
        message: err?.message || 'Erro desconhecido ao sincronizar.',
      });
      return false;
    }
  }, [queryClient]);

  // Run full sync
  const syncAll = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    
    syncingRef.current = true;
    setSyncState('syncing');

    try {
      const records = await getPendingRecords();
      
      if (records.length === 0) {
        setSyncState('idle');
        syncingRef.current = false;
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const record of records) {
        // Skip records that have failed too many times
        if (record.retry_count >= 5) continue;
        
        const success = await processRecord(record);
        if (success) successCount++;
        else errorCount++;
      }

      // Clean up synced records
      await removeSyncedRecords();
      await refreshPendingCount();

      if (errorCount > 0) {
        setSyncState('error');
        toast.error(`${errorCount} registro(s) com erro na sincronização`, {
          description: 'Tentaremos novamente automaticamente.',
          duration: 4000,
        });
      } else if (successCount > 0) {
        setSyncState('done');
        toast.success('Todos os dados sincronizados', {
          description: `${successCount} registro(s) sincronizado(s) com sucesso.`,
          duration: 3000,
        });
        // Reset to idle after showing success
        setTimeout(() => setSyncState('idle'), 3000);
      } else {
        setSyncState('idle');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncState('error');
    } finally {
      syncingRef.current = false;
    }
  }, [processRecord, refreshPendingCount]);

  // Manual retry
  const retrySync = useCallback(async () => {
    await syncAll();
  }, [syncAll]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncAll();
    }
  }, [isOnline, syncAll]);

  // Refresh count on mount
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Periodic sync attempt every 30s when online
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      if (pendingCount > 0) syncAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [isOnline, pendingCount, syncAll]);

  return {
    syncState,
    pendingCount,
    queueOfflineRecord,
    retrySync,
    syncAll,
    refreshPendingCount,
  };
};
