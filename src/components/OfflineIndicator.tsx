import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineSync, type SyncState } from '@/hooks/useOfflineSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createContext, useContext } from 'react';

// Context to share offline sync capabilities
interface OfflineContextType {
  isOnline: boolean;
  queueOfflineRecord: ReturnType<typeof useOfflineSync>['queueOfflineRecord'];
  pendingCount: number;
  syncState: SyncState;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export const useOfflineContext = () => {
  const ctx = useContext(OfflineContext);
  return ctx;
};

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const { isOnline } = useNetworkStatus();
  const { syncState, pendingCount, queueOfflineRecord, retrySync } = useOfflineSync();

  const showBanner = !isOnline || syncState === 'syncing' || syncState === 'done' || pendingCount > 0;

  return (
    <OfflineContext.Provider value={{ isOnline, queueOfflineRecord, pendingCount, syncState }}>
      {showBanner && (
        <OfflineBanner
          isOnline={isOnline}
          syncState={syncState}
          pendingCount={pendingCount}
          onRetry={retrySync}
        />
      )}
      {children}
    </OfflineContext.Provider>
  );
};

interface OfflineBannerProps {
  isOnline: boolean;
  syncState: SyncState;
  pendingCount: number;
  onRetry: () => void;
}

const OfflineBanner = ({ isOnline, syncState, pendingCount, onRetry }: OfflineBannerProps) => {
  const getConfig = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
        text: 'Modo Offline',
        sub: pendingCount > 0
          ? `${pendingCount} registro(s) aguardando sincronização`
          : 'Os dados serão sincronizados automaticamente',
      };
    }
    if (syncState === 'syncing') {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        bg: 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400',
        text: 'Conectado',
        sub: 'Sincronizando dados...',
      };
    }
    if (syncState === 'done') {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        bg: 'bg-green-500/15 border-green-500/30 text-green-700 dark:text-green-400',
        text: 'Conectado',
        sub: 'Todos os dados sincronizados',
      };
    }
    if (syncState === 'error' || pendingCount > 0) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        bg: 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400',
        text: 'Online',
        sub: `${pendingCount} registro(s) com erro`,
        showRetry: true,
      };
    }
    return null;
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border-b transition-all duration-300',
        config.bg
      )}
    >
      {config.icon}
      <span className="font-semibold">{config.text}</span>
      <span className="opacity-80">— {config.sub}</span>
      {'showRetry' in config && config.showRetry && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs ml-2"
          onClick={onRetry}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
};
