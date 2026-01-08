import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Clock, CheckCircle2, X } from 'lucide-react';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

interface NegotiationAlertProps {
  onClose: () => void;
}

const NegotiationAlert: React.FC<NegotiationAlertProps> = ({ onClose }) => {
  const { negotiations } = useNegotiations();
  const navigate = useNavigate();

  // Calcular métricas
  const totalOpen = negotiations.length;
  
  const staleNegotiations = negotiations.filter(neg => {
    const lastUpdate = new Date(neg.updated_at);
    const daysSinceUpdate = differenceInDays(new Date(), lastUpdate);
    return daysSinceUpdate > 7;
  });

  const nearClosing = negotiations.filter(neg => {
    return neg.status === 'proposta_enviada' || neg.status === 'em_negociacao';
  });

  if (totalOpen === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary animate-pulse" />
            Alerta de Negociações
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total abertas */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
            <div className="p-2 rounded-full bg-primary/10">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOpen}</p>
              <p className="text-xs text-muted-foreground">Abertas</p>
            </div>
          </div>

          {/* Sem atualização */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{staleNegotiations.length}</p>
              <p className="text-xs text-muted-foreground">Sem atualização há 7+ dias</p>
            </div>
          </div>

          {/* Próximas do fechamento */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
            <div className="p-2 rounded-full bg-green-500/10">
              <AlertTriangle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{nearClosing.length}</p>
              <p className="text-xs text-muted-foreground">Em negociação ativa</p>
            </div>
          </div>
        </div>

        {staleNegotiations.length > 0 && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">
                {staleNegotiations.length} negociação(ões) precisam de atenção!
              </span>
            </div>
          </div>
        )}

        <Button 
          onClick={() => navigate('/negociacoes')} 
          className="w-full"
          size="sm"
        >
          Ver todas as negociações
        </Button>
      </CardContent>
    </Card>
  );
};

export default NegotiationAlert;