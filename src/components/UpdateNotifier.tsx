import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import {
  APP_VERSION,
  fetchRemoteVersion,
  forceAppUpdate,
  getInstalledVersion,
  setInstalledVersion,
} from "@/lib/version";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 min

/**
 * Verifica /version.json periodicamente. Quando detecta versão diferente,
 * exibe um toast "Uma nova versão está disponível" com os botões
 * Atualizar Agora / Atualizar Depois.
 */
export const UpdateNotifier = () => {
  const [notified, setNotified] = useState(false);
  const notifiedRef = useRef(false);

  useEffect(() => {
    // Marca a versão instalada na primeira execução
    if (!getInstalledVersion()) setInstalledVersion(APP_VERSION);

    let cancelled = false;

    const check = async () => {
      if (notifiedRef.current) return;
      const remote = await fetchRemoteVersion();
      if (!remote || cancelled) return;

      const current = getInstalledVersion() || APP_VERSION;
      if (remote.version && remote.version !== current) {
        notifiedRef.current = true;
        setNotified(true);

        toast(
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Uma nova versão está disponível</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Versão {remote.version} — atualize para receber as últimas melhorias.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={async () => {
                    toast.loading("Nova versão encontrada. Atualizando sistema...", {
                      id: "app-update",
                    });
                    setInstalledVersion(remote.version);
                    await forceAppUpdate();
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Atualizar agora
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    toast.dismiss();
                    // Permite nova notificação após 30 min
                    setTimeout(() => {
                      notifiedRef.current = false;
                      setNotified(false);
                    }, 30 * 60 * 1000);
                  }}
                >
                  Atualizar depois
                </Button>
              </div>
            </div>
          </div>,
          { duration: Infinity, id: "app-update-banner" }
        );
      }
    };

    check();
    const onFocus = () => check();
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  return null;
};

/**
 * Botão "Atualizar Sistema" — coloque em Configurações / rodapé.
 */
export const UpdateSystemButton = ({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) => {
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    setChecking(true);
    toast.loading("Verificando atualizações...", { id: "app-update" });
    const remote = await fetchRemoteVersion();
    const current = getInstalledVersion() || APP_VERSION;

    if (remote && remote.version && remote.version !== current) {
      toast.loading("Nova versão encontrada. Atualizando sistema...", {
        id: "app-update",
      });
      setInstalledVersion(remote.version);
      await forceAppUpdate();
      return;
    }

    // Mesmo sem diff, forçar update do SW garante limpeza de cache
    toast.success("Você já está na versão mais recente.", { id: "app-update" });
    setChecking(false);
  };

  return (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={handleClick}
      disabled={checking}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
      Atualizar Sistema
    </Button>
  );
};

/** Exibe versão atual em rodapé / configurações. */
export const AppVersionBadge = ({ className }: { className?: string }) => (
  <span className={`text-xs text-muted-foreground ${className ?? ""}`}>
    v{APP_VERSION}
  </span>
);
