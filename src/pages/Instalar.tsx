import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle2, Bell, Wifi, Zap, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Instalar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsInstalled(!!isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Bell, title: 'Notificações Push', desc: 'Receba alertas de negociações, follow-ups e metas' },
    { icon: Wifi, title: 'Funciona Offline', desc: 'Acesse dados mesmo sem conexão com internet' },
    { icon: Zap, title: 'Acesso Rápido', desc: 'Abra direto da tela inicial, como um app nativo' },
    { icon: Smartphone, title: 'Experiência Mobile', desc: 'Interface otimizada para telas menores' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-72 pt-20 lg:pt-8 px-4 lg:px-8 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Smartphone className="w-16 h-16 text-primary mx-auto" />
            <h1 className="text-3xl font-bold text-foreground">Instalar Axis</h1>
            <p className="text-muted-foreground">
              Instale o app no seu celular para acesso rápido e notificações em tempo real
            </p>
          </div>

          {isInstalled ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="flex items-center gap-4 p-6">
                <CheckCircle2 className="w-10 h-10 text-green-500 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">App já instalado!</h3>
                  <p className="text-sm text-muted-foreground">
                    O Axis já está instalado no seu dispositivo. Acesse pela tela inicial.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isIOS ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="w-5 h-5" />
                  Como instalar no iPhone/iPad
                </CardTitle>
                <CardDescription>Siga os passos abaixo para adicionar à tela inicial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</span>
                  <p className="text-sm text-foreground pt-1">Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima) na barra do Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</span>
                  <p className="text-sm text-foreground pt-1">Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</span>
                  <p className="text-sm text-foreground pt-1">Toque em <strong>"Adicionar"</strong> para confirmar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <Download className="w-12 h-12 text-primary" />
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">Instalar aplicativo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique no botão abaixo para instalar o Axis no seu dispositivo
                  </p>
                </div>
                <Button size="lg" onClick={handleInstall} disabled={!deferredPrompt} className="w-full max-w-xs">
                  <Download className="w-5 h-5 mr-2" />
                  {deferredPrompt ? 'Instalar agora' : 'Aguardando...'}
                </Button>
                {!deferredPrompt && (
                  <p className="text-xs text-muted-foreground text-center">
                    Se o botão não ativar, use o menu do navegador → "Instalar aplicativo" ou "Adicionar à tela inicial"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Instalar;
