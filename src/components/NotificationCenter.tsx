import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Smartphone, AlertCircle, Handshake, Users, Target, ShoppingCart } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NotificationCenter = () => {
  const {
    isSupported,
    permission,
    config,
    requestPermission,
    updateConfig,
    runAllChecks,
  } = useNotificationSystem();

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Notificações não suportadas neste navegador.</p>
        </CardContent>
      </Card>
    );
  }

  const notifTypes = [
    { key: 'staleNegotiations' as const, icon: Handshake, label: 'Negociações paradas', desc: 'Alerta quando negociações ficam sem atualização por mais de 2 dias' },
    { key: 'overdueFollowUps' as const, icon: Users, label: 'Follow-ups vencidos', desc: 'Alerta quando a data de contato com o lead já passou' },
    { key: 'goalDeadlines' as const, icon: Target, label: 'Metas próximas do prazo', desc: 'Alerta quando uma meta vence em 3 dias e está abaixo de 80%' },
    { key: 'newSales' as const, icon: ShoppingCart, label: 'Novas vendas', desc: 'Notifica quando uma venda é registrada' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba alertas no celular e no navegador sobre eventos importantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notificações bloqueadas. Acesse as configurações do navegador para ativá-las.
            </AlertDescription>
          </Alert>
        )}

        {permission === 'default' && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Ativar notificações</p>
                <p className="text-xs text-muted-foreground">Receba alertas mesmo com o app minimizado</p>
              </div>
            </div>
            <Button size="sm" onClick={requestPermission}>Ativar</Button>
          </div>
        )}

        {permission === 'granted' && (
          <>
            <div className="space-y-3">
              {notifTypes.map(({ key, icon: Icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor={key} className="text-sm">{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch
                    id={key}
                    checked={config[key]}
                    onCheckedChange={(checked) => updateConfig({ [key]: checked })}
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={runAllChecks} className="w-full">
              Testar alertas agora
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
