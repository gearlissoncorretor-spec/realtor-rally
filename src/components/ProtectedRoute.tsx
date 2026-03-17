import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { AccessDeniedMessage } from '@/components/AccessDeniedMessage';
import LoadingFallback from '@/components/LoadingFallback';
import { PATH_TO_SCREEN, roleHasScreenAccess } from '@/lib/roleScreens';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredScreen?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  allowWithoutCompany?: boolean;
}

const LOADING_TIMEOUT = 3000;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredScreen, 
  adminOnly,
  superAdminOnly,
  allowWithoutCompany 
}) => {
  const { user, loading, hasAccess, profile, isAdmin, isDiretor, isSuperAdmin, getUserRole, getDefaultRoute, error, company } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
    }
  }, [loading]);

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

  if (error) {
    return <LoadingFallback error={error} onRetry={handleRetry} />;
  }

  if (timedOut && loading) {
    return <LoadingFallback forceTimeout message="Verificando autenticação..." onRetry={handleRetry} />;
  }

  if (loading) {
    return <LoadingFallback timeout={LOADING_TIMEOUT} message="Verificando autenticação..." onRetry={handleRetry} />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const mustChangePassword = Boolean((user.user_metadata as Record<string, unknown> | undefined)?.must_change_password);

  if (mustChangePassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  // Redirect users without company to onboarding (unless already on onboarding)
  if (!allowWithoutCompany && profile && !profile.company_id && !isSuperAdmin()) {
    return <Navigate to="/onboarding" replace />;
  }

  // If on onboarding but already has company, redirect to home
  if (allowWithoutCompany && profile?.company_id) {
    return <Navigate to="/" replace />;
  }

  // Super admin should only access /super-admin
  if (isSuperAdmin() && location.pathname !== '/super-admin') {
    return <Navigate to="/super-admin" replace />;
  }

  if (profile && !profile.approved) {
    return <AccessDeniedMessage type="approval" />;
  }

  // Check company status - block if company is blocked
  if (company?.status === 'bloqueado' && !isSuperAdmin()) {
    return <AccessDeniedMessage type="permission" />;
  }

  if (superAdminOnly && !isSuperAdmin()) {
    return <AccessDeniedMessage type="permission" />;
  }

  if (adminOnly && !isAdmin()) {
    return <AccessDeniedMessage type="permission" />;
  }

  const screenToCheck = requiredScreen || PATH_TO_SCREEN[location.pathname];
  const userRole = getUserRole();

  if (isDiretor() || isAdmin() || isSuperAdmin()) {
    return <>{children}</>;
  }

  if (screenToCheck === 'instalar') {
    return <>{children}</>;
  }

  if (screenToCheck) {
    const hasScreenAccess = hasAccess(screenToCheck);
    const roleScreens = ROLE_SCREENS[userRole] || [];
    const hasRoleAccess = roleScreens.includes('*') || roleScreens.includes(screenToCheck);
    
    if (!hasRoleAccess || !hasScreenAccess) {
      const defaultRoute = getDefaultRoute();
      if (defaultRoute !== location.pathname) {
        return <Navigate to={defaultRoute} replace />;
      }
      return <AccessDeniedMessage type="permission" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
