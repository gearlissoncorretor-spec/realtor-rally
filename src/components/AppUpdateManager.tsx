import { useEffect, useCallback } from 'react';

export const AppUpdateManager = () => {
  const applyUpdate = useCallback((worker: ServiceWorker | null) => {
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Auto-apply if there's a waiting worker
        if (registration.waiting) {
          applyUpdate(registration.waiting);
          return;
        }

        // Listen for new updates and auto-apply
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              applyUpdate(newWorker);
            }
          });
        });

        // Periodic check every 2 minutes
        const interval = setInterval(() => {
          registration.update().catch(console.error);
        }, 2 * 60 * 1000);

        return () => clearInterval(interval);
      } catch (e) {
        console.error('SW registration error:', e);
      }
    };

    checkForUpdates();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [applyUpdate]);

  return null;
};
