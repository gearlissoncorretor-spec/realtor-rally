/**
 * Versão global do sistema. Incremente a cada release para forçar
 * detecção automática de atualização nos PWAs instalados.
 * Mantenha em sincronia com `public/version.json`.
 */
export const APP_VERSION = "1.0.0";

const VERSION_KEY = "app_version_installed";

export const getInstalledVersion = () =>
  (typeof localStorage !== "undefined" && localStorage.getItem(VERSION_KEY)) || null;

export const setInstalledVersion = (v: string) => {
  try {
    localStorage.setItem(VERSION_KEY, v);
  } catch {
    /* ignore */
  }
};

export type RemoteVersion = { version: string; buildTime?: string };

export async function fetchRemoteVersion(): Promise<RemoteVersion | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });
    if (!res.ok) return null;
    return (await res.json()) as RemoteVersion;
  } catch {
    return null;
  }
}

/**
 * Limpa todos os caches do Service Worker, atualiza o SW e recarrega.
 */
export async function forceAppUpdate(): Promise<void> {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs.map(async (r) => {
          try {
            await r.update();
            if (r.waiting) r.waiting.postMessage({ type: "SKIP_WAITING" });
          } catch {
            /* ignore */
          }
        })
      );
    }
  } finally {
    // Bust HTML cache via query param and reload
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString());
    window.location.replace(url.toString());
  }
}
