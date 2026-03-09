import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Smartphone, AlertCircle, Handshake, Users, Target, ShoppingCart, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useWebPush } from '@/hooks/useWebPush';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const NotificationCenter = () => {
  const {
    isSupported,
    permission,
    config,
    requestPermission,
    updateConfig,
    runAllChecks,
  } = useNotificationSystem();

  const {
    isSupported: isPushSupported,
    isSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    testPush,
  } = useWebPush();

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
    <div className="space-y-4">
      {/* Web Push - App Fechado */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {isSubscribed ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              )}
              Notificações com App Fechado
            </CardTitle>
            {isSubscribed && (
              <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                Ativo
              </Badge>
            )}
          </div>
          <CardDescription>
            Receba alertas no celular mesmo com o app fechado ou minimizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isPushSupported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seu navegador não suporta Web Push. Instale o app como PWA para melhor experiência.
              </AlertDescription>
            </Alert>
          )}

          {isPushSupported && !isSubscribed && (
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-sm">Ativar push em segundo plano</p>
                  <p className="text-xs text-muted-foreground">
                    Receba alertas mesmo com o app fechado no celular
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={subscribePush} disabled={isPushLoading}>
                {isPushLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ativar'}
              </Button>
            </div>
          )}

          {isPushSupported && isSubscribed && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={testPush} className="flex-1">
                🔔 Testar notificação push
              </Button>
              <Button variant="ghost" size="sm" onClick={unsubscribePush} disabled={isPushLoading}>
                {isPushLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desativar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificações locais e configuração de tipos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5" />
            Tipos de Alerta
          </CardTitle>
          <CardDescription>
            Escolha quais alertas deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'denied' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Notificações bloqueadas. Acesse as configurações do navegador para ativá-las.
              </AlertDescription>
            </Alert>
          )}

          {permission === 'default' && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Permitir notificações no navegador</p>
                  <p className="text-xs text-muted-foreground">Necessário para receber alertas</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={requestPermission}>Permitir</Button>
            </div>
          )}

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

          <Separator />

          <Button variant="outline" size="sm" onClick={runAllChecks} className="w-full">
            Verificar alertas agora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
