import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const AccessDenied = () => {
  const { getUserRole, getDefaultRoute } = useAuth();
  const userRole = getUserRole();
  const defaultRoute = getDefaultRoute();

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'corretor':
        return 'Corretor';
      case 'cliente':
        return 'Cliente';
      default:
        return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta área
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Seu perfil atual: <span className="font-medium text-foreground">{getRoleName(userRole)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador para solicitar acesso adicional.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to={defaultRoute} className="flex-1">
              <Button variant="default" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Ir para Início
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;