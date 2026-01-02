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

const LOADING_TIMEOUT = 3000; // 3 segundos conforme requisito

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredScreen, 
  adminOnly 
}) => {
  const { user, loading, hasAccess, profile, isAdmin, error } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Reset timeout state when loading changes
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
    }
  }, [loading]);

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    if (!loading) return;

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Loading timeout reached (3s)');
        setTimedOut(true);
      }
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [loading]);

  const handleRetry = () => {
    setTimedOut(false);
    window.location.reload();
  };

  // Estado de erro de autenticação
  if (error) {
    return (
      <LoadingFallback
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  // Estado de timeout - mostrar opções ao usuário
  if (timedOut && loading) {
    return (
      <LoadingFallback
        forceTimeout
        message="Verificando autenticação..."
        onRetry={handleRetry}
      />
    );
  }

  // Estado de carregamento normal (antes do timeout)
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
