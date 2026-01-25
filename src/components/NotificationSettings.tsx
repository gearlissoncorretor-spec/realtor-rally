import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Smartphone, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NotificationSettings = () => {
  const {
    isSupported,
    permission,
    settings,
    requestPermission,
    updateSettings,
    checkPendingNegotiations,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Notificações push não são suportadas neste navegador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleEnableNotifications = async () => {
    if (permission === 'default') {
      await requestPermission();
    } else if (permission === 'denied') {
      // Can't re-request permission, user needs to enable in browser settings
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba alertas sobre negociações pendentes e outras atualizações importantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As notificações foram bloqueadas. Para ativá-las, acesse as configurações do seu navegador.
            </AlertDescription>
          </Alert>
        )}

        {permission === 'default' && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Ativar notificações</p>
                <p className="text-sm text-muted-foreground">
                  Receba alertas mesmo quando o app estiver fechado
                </p>
              </div>
            </div>
            <Button onClick={handleEnableNotifications}>
              Ativar
            </Button>
          </div>
        )}

        {permission === 'granted' && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Notificações ativadas</Label>
                <p className="text-sm text-muted-foreground">
                  Ativa ou desativa todas as notificações
                </p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSettings({ enabled: checked })}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium">Tipos de notificação</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pendingNegotiations">Negociações pendentes</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerta quando há negociações sem atualização há mais de 2 dias
                  </p>
                </div>
                <Switch
                  id="pendingNegotiations"
                  checked={settings.pendingNegotiations}
                  onCheckedChange={(checked) => updateSettings({ pendingNegotiations: checked })}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newSales">Novas vendas</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifica quando uma nova venda é registrada
                  </p>
                </div>
                <Switch
                  id="newSales"
                  checked={settings.newSales}
                  onCheckedChange={(checked) => updateSettings({ newSales: checked })}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="goalProgress">Progresso de metas</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualizações sobre o progresso das suas metas
                  </p>
                </div>
                <Switch
                  id="goalProgress"
                  checked={settings.goalProgress}
                  onCheckedChange={(checked) => updateSettings({ goalProgress: checked })}
                  disabled={!settings.enabled}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Button 
                variant="outline" 
                onClick={checkPendingNegotiations}
                disabled={!settings.enabled || !settings.pendingNegotiations}
              >
                Testar notificação
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
