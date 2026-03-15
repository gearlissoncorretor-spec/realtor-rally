import { useState, useEffect, useCallback } from 'react';

export type NetworkState = 'online' | 'offline';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkState>(
    navigator.onLine ? 'online' : 'offline'
  );

  const handleOnline = useCallback(() => setStatus('online'), []);
  const handleOffline = useCallback(() => setStatus('offline'), []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline: status === 'online',
    isOffline: status === 'offline',
    status,
  };
};
