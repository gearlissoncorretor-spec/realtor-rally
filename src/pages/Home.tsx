import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiretorDashboard from '@/components/dashboards/DiretorDashboard';
import GerenteDashboard from '@/components/dashboards/GerenteDashboard';
import CorretorDashboard from '@/components/dashboards/CorretorDashboard';

const Home = () => {
  const { profile, loading, getUserRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Erro ao carregar perfil do usuário</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const role = getUserRole();

  // Render dashboard based on user role
  switch (role) {
    case 'diretor':
    case 'admin':
      return <DiretorDashboard />;
    case 'gerente':
      return <GerenteDashboard />;
    case 'corretor':
      return <CorretorDashboard />;
    default:
      return <CorretorDashboard />; // Default to corretor dashboard
  }
};

export default Home;