import React from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Index from '@/pages/Index';
import CorretorDashboard from '@/components/dashboards/CorretorDashboard';
import BirthdayPopup from '@/components/BirthdayPopup';

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

  const dashboard = (() => {
    switch (role) {
      case 'socio':
      case 'diretor':
      case 'admin':
      case 'gerente':
        return <Index />;
      case 'corretor':
        return <CorretorDashboard />;
      default:
        return <Index />;
    }
  })();

  return (
    <>
      <BirthdayPopup />
      {dashboard}
    </>
  );
};

export default Home;
