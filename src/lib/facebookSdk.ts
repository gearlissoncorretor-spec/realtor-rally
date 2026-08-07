import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}

const API_VERSION = 'v21.0';
let started = false;

/**
 * Carrega o SDK do Facebook para JavaScript de forma assíncrona.
 * O App ID é obtido do backend (segredo FACEBOOK_APP_ID) — nada é hardcoded.
 */
export async function loadFacebookSdk(): Promise<void> {
  if (started || typeof document === 'undefined') return;
  started = true;

  let appId = '';
  try {
    const { data } = await supabase.functions.invoke('facebook-oauth', {
      body: { action: 'validate' },
    });
    appId = (data as any)?.app_id ?? '';
  } catch {
    // integração não configurada — não carrega o SDK
  }
  if (!appId) return;

  window.fbAsyncInit = function () {
    window.FB?.init({
      appId,
      cookie: true,
      xfbml: true,
      version: API_VERSION,
    });
    window.FB?.AppEvents?.logPageView?.();
  };

  const id = 'facebook-jssdk';
  if (document.getElementById(id)) return;
  const fjs = document.getElementsByTagName('script')[0];
  const js = document.createElement('script');
  js.id = id;
  js.async = true;
  js.defer = true;
  js.crossOrigin = 'anonymous';
  js.src = 'https://connect.facebook.net/pt_BR/sdk.js';
  fjs?.parentNode?.insertBefore(js, fjs);
}
