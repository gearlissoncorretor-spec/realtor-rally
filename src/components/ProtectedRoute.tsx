import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import AccessDenied from '@/components/AccessDenied';
import { AccessDeniedMessage } from '@/components/AccessDeniedMessage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredScreen?: string;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, requiredScreen, adminOnly }: ProtectedRouteProps) => {
  const { user, loading, hasAccess, profile, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is approved
  if (profile && !profile.approved) {
    return <AccessDeniedMessage type="approval" />;
  }

  // Check if admin access is required
  if (adminOnly && !isAdmin()) {
    return <AccessDenied />;
  }

  if (requiredScreen && !hasAccess(requiredScreen)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;