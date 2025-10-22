import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DiretorDashboard from '@/components/dashboards/DiretorDashboard';
import GerenteDashboard from '@/components/dashboards/GerenteDashboard';
import CorretorDashboard from '@/components/dashboards/CorretorDashboard';
import { Loader2 } from 'lucide-react';

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