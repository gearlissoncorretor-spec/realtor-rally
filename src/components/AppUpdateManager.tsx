import { useEffect } from 'react';

export const AppUpdateManager = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Only apply updates on page load (when user enters/re-enters the app)
    const applyPendingUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Check for new version on load, but don't auto-reload
        await registration.update();
        
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (e) {
        console.error('SW update check error:', e);
      }
    };

    applyPendingUpdate();

    // No periodic checks, no auto-reload while using the app
  }, []);

  return null;
};
