import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export const RealtimeSyncProvider = () => {
  useRealtimeSync();
  return null;
};
