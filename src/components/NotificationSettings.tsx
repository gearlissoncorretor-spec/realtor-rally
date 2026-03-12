import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Smartphone, AlertCircle, Send, Loader2 } from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NotificationSettings = () => {
  const {
    isSupported: webPushSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testPush,
  } = useWebPush();

  const {
    isSupported: notifSupported,
    permission,
    config,
    requestPermission,
    updateConfig,
  } = useNotificationSystem();

  const isSupported = webPushSupported && notifSupported;

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

  const handleActivatePush = async () => {
    if (permission === 'default') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await subscribe();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba alertas no celular mesmo com o app fechado ou em segundo plano.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As notificações foram bloqueadas. Para ativá-las, acesse as configurações do seu navegador/celular.
            </AlertDescription>
          </Alert>
        )}

        {!isSubscribed ? (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">Ativar notificações push</p>
                <p className="text-sm text-muted-foreground">
                  Receba alertas mesmo com o app fechado ou o celular bloqueado
                </p>
              </div>
            </div>
            <Button onClick={handleActivatePush} disabled={isLoading || permission === 'denied'}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ativar
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-foreground">Push ativo — notificações chegarão mesmo com app fechado</span>
              </div>
              <Button variant="ghost" size="sm" onClick={unsubscribe} disabled={isLoading}>
                Desativar
              </Button>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-foreground">Tipos de alerta</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="staleNegotiations">Negociações paradas</Label>
                  <p className="text-sm text-muted-foreground">Sem atualização há mais de 2 dias</p>
                </div>
                <Switch
                  id="staleNegotiations"
                  checked={config.staleNegotiations}
                  onCheckedChange={(checked) => updateConfig({ staleNegotiations: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="overdueFollowUps">Follow-ups vencidos</Label>
                  <p className="text-sm text-muted-foreground">Contatos com data de retorno vencida</p>
                </div>
                <Switch
                  id="overdueFollowUps"
                  checked={config.overdueFollowUps}
                  onCheckedChange={(checked) => updateConfig({ overdueFollowUps: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="goalDeadlines">Metas em risco</Label>
                  <p className="text-sm text-muted-foreground">Metas próximas do prazo abaixo de 80%</p>
                </div>
                <Switch
                  id="goalDeadlines"
                  checked={config.goalDeadlines}
                  onCheckedChange={(checked) => updateConfig({ goalDeadlines: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newSales">Novas vendas</Label>
                  <p className="text-sm text-muted-foreground">Quando uma venda é registrada na empresa</p>
                </div>
                <Switch
                  id="newSales"
                  checked={config.newSales}
                  onCheckedChange={(checked) => updateConfig({ newSales: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="brokerBirthdays">Aniversários</Label>
                  <p className="text-sm text-muted-foreground">Lembrete de aniversário de corretores</p>
                </div>
                <Switch
                  id="brokerBirthdays"
                  checked={config.brokerBirthdays}
                  onCheckedChange={(checked) => updateConfig({ brokerBirthdays: checked })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={testPush} disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Enviar notificação de teste
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Feche o app após ativar e aguarde — a notificação de teste chegará no celular.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
