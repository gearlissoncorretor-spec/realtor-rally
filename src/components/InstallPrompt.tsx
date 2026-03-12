import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true;
};

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      setIsIOSDevice(true);
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
      <Card className="p-4 border-primary/30 bg-card/95 backdrop-blur-lg shadow-2xl shadow-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {isIOSDevice ? (
              <img src="/pwa-192x192.png" alt="App" className="w-8 h-8 rounded-lg" />
            ) : (
              <Download className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Instalar aplicativo</p>
            {isIOSDevice ? (
              <div className="mt-1.5 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Para instalar, siga os passos:
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Share className="w-3 h-3 text-primary" />
                    </div>
                    <span>1. Toque em <strong>Compartilhar</strong> <span className="text-muted-foreground">(ícone ⬆️)</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus className="w-3 h-3 text-primary" />
                    </div>
                    <span>2. Toque em <strong>Adicionar à Tela de Início</strong></span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-7 text-xs text-muted-foreground mt-1">
                  Entendi
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adicione à tela inicial para acesso rápido e experiência completa.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleInstall} className="h-8 text-xs">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Instalar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 text-xs text-muted-foreground">
                    Agora não
                  </Button>
                </div>
              </>
            )}
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default InstallPrompt;
