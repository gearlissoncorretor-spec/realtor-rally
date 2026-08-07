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
    ready = true;
    readyResolvers.forEach((r) => r());
    readyResolvers = [];
    // Verifica o status de login assim que o SDK carrega
    window.FB?.getLoginStatus((response: FBStatusResponse) => {
      lastStatus = response;
      window.dispatchEvent(new CustomEvent('fb:status', { detail: response }));
    });
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

/** Aguarda o SDK estar inicializado (resolve false se não configurado). */
export function whenFbReady(timeoutMs = 8000): Promise<boolean> {
  if (ready) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    readyResolvers.push(() => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

/** Retorna o status de login do usuário no Facebook / no app. */
export async function getFacebookLoginStatus(): Promise<FBStatusResponse> {
  await loadFacebookSdk();
  const ok = await whenFbReady();
  if (!ok || !window.FB) return { status: 'unknown' };
  return new Promise((resolve) => {
    window.FB.getLoginStatus((response: FBStatusResponse) => {
      lastStatus = response;
      resolve(response);
    });
  });
}

/** Último status conhecido, sem nova chamada à Meta. */
export function getCachedFacebookStatus(): FBStatusResponse | null {
  return lastStatus;
}

/** Abre o diálogo de login do Facebook com os escopos informados. */
export async function facebookLogin(
  scope = 'public_profile,pages_show_list',
): Promise<FBStatusResponse> {
  await loadFacebookSdk();
  const ok = await whenFbReady();
  if (!ok || !window.FB) return { status: 'unknown' };
  return new Promise((resolve) => {
    window.FB.login((response: FBStatusResponse) => {
      lastStatus = response;
      resolve(response);
    }, { scope });
  });
}

