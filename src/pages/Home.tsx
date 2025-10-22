import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy load dashboards based on role
const DiretorDashboard = lazy(() => import('@/components/dashboards/DiretorDashboard'));
const GerenteDashboard = lazy(() => import('@/components/dashboards/GerenteDashboard'));
const CorretorDashboard = lazy(() => import('@/components/dashboards/CorretorDashboard'));

const Home = () => {
  const { profile, loading, getUserRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Erro ao carregar perfil do usuário</p>
      </div>
    );
  }

  const role = getUserRole();

  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  // Render dashboard based on user role with lazy loading
  const renderDashboard = () => {
    switch (role) {
      case 'diretor':
      case 'admin':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DiretorDashboard />
          </Suspense>
        );
      case 'gerente':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <GerenteDashboard />
          </Suspense>
        );
      case 'corretor':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CorretorDashboard />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CorretorDashboard />
          </Suspense>
        );
    }
  };

  return renderDashboard();
};

export default Home;