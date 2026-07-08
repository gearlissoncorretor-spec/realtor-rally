import { useEffect } from 'react';

/**
 * Ensures the mobile/PWA client always applies the latest deployed version.
 * - Activates any waiting service worker immediately (skipWaiting)
 * - Reloads the page automatically when a new SW takes control
 * - Re-checks for updates on focus / visibility change
 */
export const AppUpdateManager = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const checkForUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (e) {
        console.error('SW update check error:', e);
      }
    };

    checkForUpdate();

    const onFocus = () => checkForUpdate();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // Periodic check every 5 minutes while app is open
    const interval = window.setInterval(checkForUpdate, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  return null;
};
