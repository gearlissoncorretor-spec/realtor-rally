import { AlertTriangle, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export const DevModeWarning = () => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Badge variant="destructive">MODO DESENVOLVIMENTO</Badge>
        Sistema Sem Autenticação
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>
            <strong>⚠️ ATENÇÃO:</strong> O sistema está configurado para funcionar sem autenticação para facilitar o desenvolvimento.
          </p>
          <div className="text-sm space-y-1">
            <p>• <strong>RLS (Row Level Security)</strong> desabilitado em todas as tabelas</p>
            <p>• <strong>Acesso livre</strong> a todas as funcionalidades</p>
            <p>• <strong>Senhas visíveis</strong> no painel de debug</p>
            <p>• <strong>Políticas de segurança</strong> temporariamente desativadas</p>
          </div>
          <p className="text-xs mt-2 font-semibold">
            🚨 LEMBRE-SE: Reativar a autenticação e segurança antes de colocar em produção!
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};