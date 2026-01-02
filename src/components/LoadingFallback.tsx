import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingFallbackProps {
  /** Tempo em ms antes de mostrar opção de recarregar (default: 3000) */
  timeout?: number;
  /** Mensagem customizada de loading */
  message?: string;
  /** Mensagem de erro (se houver) */
  error?: string | null;
  /** Callback para retry */
  onRetry?: () => void;
  /** Mostra skeleton ao invés de spinner */
  showSkeleton?: boolean;
  /** Força exibição do estado de timeout */
  forceTimeout?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  timeout = 3000,
  message = 'Carregando...',
  error = null,
  onRetry,
  showSkeleton = false,
  forceTimeout = false,
}) => {
  const [showRetry, setShowRetry] = useState(forceTimeout);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (forceTimeout) {
      setShowRetry(true);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const newElapsed = prev + 1000;
        if (newElapsed >= timeout) {
          setShowRetry(true);
        }
        return newElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeout, forceTimeout]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoToLogin = () => {
    window.location.href = '/auth';
  };

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Ocorreu um erro</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button onClick={handleGoToLogin} variant="outline">
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado de timeout
  if (showRetry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-warning" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Carregamento lento</h2>
            <p className="text-sm text-muted-foreground">
              O carregamento está demorando mais que o esperado. 
              Verifique sua conexão ou tente novamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recarregar página
            </Button>
            <Button onClick={handleGoToLogin} variant="outline">
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado de loading normal
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{message}</p>
          {elapsed >= 2000 && (
            <p className="text-xs text-muted-foreground/70 animate-fade-in">
              Aguarde um momento...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
