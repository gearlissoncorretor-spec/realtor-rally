import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, Globe, MessageCircle, Plug } from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'facebook',
    name: 'Facebook Lead Ads',
    description: 'Receba leads diretamente das suas campanhas do Meta Ads.',
    icon: Facebook,
    color: 'text-blue-500',
  },
  {
    id: 'site',
    name: 'Formulário do Site',
    description: 'Capture leads pelas suas landing pages e formulários.',
    icon: Globe,
    color: 'text-violet-500',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Integre conversas iniciadas via WhatsApp como leads.',
    icon: MessageCircle,
    color: 'text-emerald-500',
  },
];

export const MyIntegrations = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="w-5 h-5 text-primary" />
          Minhas Integrações
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.id}
              className="rounded-lg border bg-card/50 p-4 flex flex-col gap-3 hover:bg-card transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${it.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-xs bg-muted/50">Não conectado</Badge>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">{it.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{it.description}</p>
              </div>
              <Button variant="outline" size="sm" disabled className="w-full">
                Em breve
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
