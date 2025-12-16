import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import { AccessDeniedMessage } from '@/components/AccessDeniedMessage';
import LoadingFallback from '@/components/LoadingFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredScreen?: string;
  adminOnly?: boolean;
}

const LOADING_TIMEOUT = 8000; // 8 segundos máximo de loading

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredScreen, 
  adminOnly 
}) => {
  const { user, loading, hasAccess, profile, isAdmin } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Loading timeout reached');
        setTimedOut(true);
      }
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [loading]);

  // Verificar erros de autenticação
  useEffect(() => {
    // Se não está carregando, não tem usuário e não teve timeout,
    // provavelmente houve um erro silencioso
    if (!loading && !user && !timedOut) {
      // Aguardar um frame para garantir que estados foram atualizados
      const checkAuth = setTimeout(() => {
        if (!user) {
          // Não é erro, apenas não está autenticado
          setError(null);
        }
      }, 100);
      return () => clearTimeout(checkAuth);
    }
  }, [loading, user, timedOut]);

  // Função para retry
  const handleRetry = () => {
    setTimedOut(false);
    setError(null);
    window.location.reload();
  };

  // Estado de timeout - mostrar opções ao usuário
  if (timedOut) {
    return (
      <LoadingFallback
        forceTimeout
        message="Verificando autenticação..."
        onRetry={handleRetry}
      />
    );
  }

  // Estado de erro
  if (error) {
    return (
      <LoadingFallback
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  // Estado de carregamento
  if (loading) {
    return (
      <LoadingFallback
        timeout={LOADING_TIMEOUT}
        message="Verificando autenticação..."
        onRetry={handleRetry}
      />
    );
  }

  // Não autenticado - redirecionar para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Usuário não aprovado
  if (profile && !profile.approved) {
    return <AccessDeniedMessage type="approval" />;
  }

  // Verificação de admin
  if (adminOnly && !isAdmin()) {
    return <AccessDenied />;
  }

  // Verificação de acesso à tela específica
  if (requiredScreen && !hasAccess(requiredScreen)) {
    return <AccessDenied />;
  }

  // Tudo OK - renderizar children
  return <>{children}</>;
};

export default ProtectedRoute;
