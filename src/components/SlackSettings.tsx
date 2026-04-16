import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendSlackNotification } from '@/hooks/useSlackNotify';

const STORAGE_KEY = 'slack_settings';

interface SlackSettings {
  channel: string;
  notifyNewSale: boolean;
  notifyGoalReached: boolean;
  notifyStalledNegotiation: boolean;
  notifyOverdueFollowUp: boolean;
}

const defaultSettings: SlackSettings = {
  channel: 'general',
  notifyNewSale: true,
  notifyGoalReached: true,
  notifyStalledNegotiation: true,
  notifyOverdueFollowUp: true,
};

export const SlackSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SlackSettings>(defaultSettings);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Error parsing slack settings:", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast({
      title: "Configurações do Slack salvas",
      description: "As notificações serão enviadas conforme configurado.",
    });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await sendSlackNotification({
        event_type: 'nova_venda',
        data: {
          broker_name: 'Corretor Teste',
          client_name: 'Cliente Exemplo',
          property_address: 'Rua Teste, 123',
          property_type: 'Apartamento',
          property_value: 500000,
          vgv: 500000,
          sale_date: new Date().toLocaleDateString('pt-BR'),
        },
        channel: settings.channel,
      });

      if (result.success) {
        toast({
          title: "✅ Mensagem enviada!",
          description: `Verifique o canal #${settings.channel} no Slack.`,
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Verifique o nome do canal e tente novamente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível conectar ao Slack.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          Conectado
        </Badge>
        <span className="text-xs text-muted-foreground">Bot: Gestão Master</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slack-channel" className="text-sm font-medium">Canal do Slack</Label>
        <Input
          id="slack-channel"
          value={settings.channel}
          onChange={(e) => setSettings(prev => ({ ...prev, channel: e.target.value.replace('#', '') }))}
          placeholder="general"
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">Nome do canal público (sem #)</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Tipos de Notificação</Label>
        
        {[
          { key: 'notifyNewSale' as const, label: 'Nova venda registrada', emoji: '🎉' },
          { key: 'notifyGoalReached' as const, label: 'Meta atingida', emoji: '🏆' },
          { key: 'notifyStalledNegotiation' as const, label: 'Negociações paradas (7+ dias)', emoji: '⚠️' },
          { key: 'notifyOverdueFollowUp' as const, label: 'Follow-ups atrasados', emoji: '📋' },
        ].map(({ key, label, emoji }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm">
              {emoji} {label}
            </span>
            <Switch
              checked={settings[key]}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, [key]: checked }))}
            />
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={handleSave} size="sm">
          <CheckCircle className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
        <Button onClick={handleTest} size="sm" variant="outline" disabled={testing}>
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enviar Mensagem de Teste
        </Button>
      </div>
    </div>
  );
};

export default SlackSettings;
