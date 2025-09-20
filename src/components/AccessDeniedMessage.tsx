import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccessDeniedMessageProps {
  type?: 'permission' | 'approval' | 'general';
  message?: string;
}

export const AccessDeniedMessage = ({ 
  type = 'permission', 
  message 
}: AccessDeniedMessageProps) => {
  const { getUserRole, getDefaultRoute, profile } = useAuth();

  const getContent = () => {
    switch (type) {
      case 'approval':
        return {
          title: 'Conta Aguardando Aprovação',
          description: 'Sua conta foi criada com sucesso, mas ainda não foi aprovada pelos administradores. Você receberá um email quando sua conta for ativada.',
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />
        };
      case 'permission':
        return {
          title: 'Acesso Restrito',
          description: message || `Você não tem permissão para acessar esta área. Seu perfil atual (${getUserRole()}) não possui acesso a este recurso.`,
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />
        };
      default:
        return {
          title: 'Acesso Negado',
          description: message || 'Você não tem permissão para acessar este recurso.',
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          <CardTitle className="text-xl">{content.title}</CardTitle>
          <CardDescription className="text-center">
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to={getDefaultRoute()}>
                <Home className="mr-2 h-4 w-4" />
                Ir para Início
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          {profile && !profile.approved && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-900/40">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Dica:</strong> Entre em contato com o administrador do sistema para acelerar o processo de aprovação.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};