import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

export const AppUpdateManager = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [waitingWorker]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check for waiting worker on load
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Periodic check every 5 minutes
        const interval = setInterval(() => {
          registration.update().catch(console.error);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
      } catch (e) {
        console.error('SW registration error:', e);
      }
    };

    checkForUpdates();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!updateAvailable) return;
    
    toast(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <Download className="h-4 w-4 text-primary" />
          Nova versão disponível!
        </div>
        <p className="text-sm text-muted-foreground">
          Uma atualização está pronta. Atualize agora para ter a melhor experiência.
        </p>
        <Button 
          size="sm" 
          onClick={applyUpdate}
          className="w-full mt-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar agora
        </Button>
      </div>,
      {
        duration: Infinity,
        id: 'app-update',
        position: 'top-center',
      }
    );
  }, [updateAvailable, applyUpdate]);

  return null;
};
