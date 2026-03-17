import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Flame, Share2, Image } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting';
import { cn } from '@/lib/utils';
import { generateGoalCard, generateRankingCard, generateSaleCard } from './whatsapp-cards/canvasCardGenerator';

const MOTIVATIONAL_PHRASES = [
  "Cada dia é uma nova chance de superar seus limites!",
  "Sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "O topo não é lotado — continue subindo!",
  "Você não chegou até aqui para parar agora.",
  "Foco na meta, o resto é paisagem!",
  "Disciplina é escolher entre o que você quer agora e o que você mais quer.",
  "Campeões treinam, perdedores reclamam.",
  "A diferença entre o ordinário e o extraordinário é aquele pequeno extra.",
  "Sua energia contagia! Continue inspirando!",
  "Grandes resultados exigem grandes atitudes!",
];

const getRandomPhrase = () => MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];

// ─── Goal Reminder Card ───────────────────────────────────────

interface GoalReminderProps {
  goalTitle: string;
  targetValue: number;
  currentValue: number;
  targetType: string;
  endDate: string;
  brokerName?: string;
  brokerPhone?: string;
  brokerAvatarUrl?: string | null;
}

export const GoalReminderCard: React.FC<GoalReminderProps> = ({
  goalTitle, targetValue, currentValue, targetType, endDate, brokerName,
}) => {
  const progress = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  const isCurrency = ['revenue', 'vgv', 'vgc', 'commission'].includes(targetType);
  const fmt = (v: number) => isCurrency ? formatCurrency(v) : v.toLocaleString('pt-BR');
  const phrase = getRandomPhrase();

  const handleGenerate = () => {
    generateGoalCard({
      brokerName: brokerName || 'Corretor',
      goalTitle,
      currentValue,
      targetValue,
      motivationalPhrase: phrase,
    });
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm text-foreground">Lembrete de Meta</span>
          {brokerName && <Badge variant="outline" className="ml-auto text-xs">{brokerName}</Badge>}
        </div>
        <p className="font-semibold text-foreground">{goalTitle}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{fmt(currentValue)} / {fmt(targetValue)}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground italic">📅 Prazo: {new Date(endDate).toLocaleDateString('pt-BR')}</p>
        <p className="text-xs text-primary font-medium">💪 {phrase}</p>
        <Button size="sm" className="w-full gap-2" onClick={handleGenerate}>
          <Image className="h-4 w-4" />
          Gerar Card
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Ranking Card ─────────────────────────────────────────────

interface RankingShareProps {
  brokerName: string;
  position: number;
  totalSales: number;
  vgv: number;
  brokerPhone?: string;
  brokerAvatarUrl?: string | null;
}

export const RankingShareCard: React.FC<RankingShareProps> = ({
  brokerName, position, totalSales, vgv,
}) => {
  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`;
  const phrase = getRandomPhrase();

  const handleGenerate = () => {
    generateRankingCard({
      brokerName,
      position,
      totalSales,
      vgv,
      motivationalPhrase: phrase,
    });
  };

  return (
    <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-6 translate-x-6" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-sm text-foreground">Ranking Semanal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{medal}</span>
          <div>
            <p className="font-bold text-foreground">{brokerName}</p>
            <p className="text-xs text-muted-foreground">{totalSales} vendas · {formatCurrency(vgv)}</p>
          </div>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">💪 {phrase}</p>
        <Button size="sm" className="w-full gap-2" onClick={handleGenerate}>
          <Image className="h-4 w-4" />
          Gerar Card
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Sale Celebration Card ────────────────────────────────────

interface SaleCelebrationProps {
  brokerName: string;
  clientName: string;
  propertyValue: number;
  propertyType?: string;
  brokerPhone?: string;
  brokerAvatarUrl?: string | null;
}

export const SaleCelebrationCard: React.FC<SaleCelebrationProps> = ({
  brokerName, clientName, propertyValue, propertyType,
}) => {
  const phrase = getRandomPhrase();

  const handleGenerate = () => {
    generateSaleCard({
      brokerName,
      clientName,
      propertyValue,
      propertyType,
      motivationalPhrase: phrase,
    });
  };

  return (
    <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-8 translate-x-8" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-emerald-500" />
          <span className="font-bold text-sm text-foreground">🎉 Venda Fechada!</span>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-foreground">{brokerName}</p>
          <p className="text-sm text-muted-foreground">Cliente: {clientName}</p>
          {propertyType && <p className="text-xs text-muted-foreground">Tipo: {propertyType}</p>}
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(propertyValue)}</p>
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">💪 {phrase}</p>
        <Button size="sm" className="w-full gap-2" onClick={handleGenerate}>
          <Image className="h-4 w-4" />
          Gerar Card
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Combined Dialog ──────────────────────────────────────────

interface WhatsAppShareDialogProps {
  trigger?: React.ReactNode;
  goals?: GoalReminderProps[];
  rankings?: RankingShareProps[];
  sales?: SaleCelebrationProps[];
}

export const WhatsAppShareDialog: React.FC<WhatsAppShareDialogProps> = ({
  trigger, goals = [], rankings = [], sales = [],
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'ranking' | 'sales'>('goals');

  const tabs = [
    { key: 'goals' as const, label: 'Metas', icon: Target, count: goals.length },
    { key: 'ranking' as const, label: 'Ranking', icon: Trophy, count: rankings.length },
    { key: 'sales' as const, label: 'Vendas', icon: Flame, count: sales.length },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Gerar Cards
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Gerar Cards
          </DialogTitle>
          <DialogDescription>
            Clique em "Gerar Card" para criar e baixar a imagem automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                activeTab === t.key
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{t.count}</Badge>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3 mt-2">
          {activeTab === 'goals' && (
            goals.length > 0
              ? goals.map((g, i) => <GoalReminderCard key={i} {...g} />)
              : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta ativa para compartilhar.</p>
          )}
          {activeTab === 'ranking' && (
            rankings.length > 0
              ? rankings.map((r, i) => <RankingShareCard key={i} {...r} />)
              : <p className="text-sm text-muted-foreground text-center py-4">Nenhum ranking disponível.</p>
          )}
          {activeTab === 'sales' && (
            sales.length > 0
              ? sales.map((s, i) => <SaleCelebrationCard key={i} {...s} />)
              : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda recente para celebrar.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
