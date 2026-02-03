import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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

// Mapping from URL paths to screen identifiers
const PATH_TO_SCREEN: Record<string, string> = {
  '/': 'dashboard',
  '/vendas': 'vendas',
  '/corretores': 'corretores',
  '/equipes': 'equipes',
  '/ranking': 'ranking',
  '/metas': 'metas',
  '/acompanhamento': 'acompanhamento',
  '/relatorios': 'relatorios',
  '/x1': 'x1',
  '/dashboard-equipes': 'dashboard-equipes',
  '/tarefas-kanban': 'tarefas-kanban',
  '/atividades': 'atividades',
  '/negociacoes': 'negociacoes',
  '/follow-up': 'follow-up',
  '/meta-gestao': 'meta-gestao',
  '/configuracoes': 'configuracoes',
};

// Screens that are accessible based on role (used as fallback)
const ROLE_SCREENS: Record<string, string[]> = {
  diretor: ['*'], // All screens
  admin: ['*'], // All screens
  gerente: ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'meta-gestao', 'atividades', 'corretores', 'equipes', 'ranking', 'acompanhamento', 'tarefas-kanban', 'x1', 'configuracoes'],
  corretor: ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'tarefas-kanban', 'configuracoes'],
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredScreen, 
  adminOnly 
}) => {
  const { user, loading, hasAccess, profile, isAdmin, isDiretor, getUserRole, error } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const location = useLocation();

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

  // Get the required screen from props or from the current path
  const screenToCheck = requiredScreen || PATH_TO_SCREEN[location.pathname];
  const userRole = getUserRole();

  // Directors and Admins have access to everything
  if (isDiretor() || isAdmin()) {
    return <>{children}</>;
  }

  // Check role-based access first
  const roleScreens = ROLE_SCREENS[userRole] || [];
  const hasRoleAccess = roleScreens.includes('*') || roleScreens.includes(screenToCheck);

  // If screen requires specific check, verify both role and allowed_screens
  if (screenToCheck) {
    // Check if user has this screen in their allowed_screens
    const hasScreenAccess = hasAccess(screenToCheck);
    
    // For screens that the role allows, also check allowed_screens
    if (!hasRoleAccess && !hasScreenAccess) {
      return <AccessDenied />;
    }
  }

  // Tudo OK - renderizar children
  return <>{children}</>;
};

export default ProtectedRoute;
