import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  Handshake,
  Building2,
  CalendarCheck,
  Play,
  Pause,
  Square,
  Clock,
  Trophy,
  Zap,
  PlusCircle,
} from "lucide-react";
import { Campaign, CampaignParticipant } from "@/hooks/useCampaigns";
import { cn } from "@/lib/utils";

interface Broker {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface CampaignLivePanelProps {
  campaign: Campaign;
  participants: CampaignParticipant[];
  brokers: Broker[];
  currentBrokerId?: string;
  canManage: boolean;
  onStart: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onFinish: (id: string) => Promise<void>;
  onIncrement: (data: { participantId: string; field: 'calls' | 'negotiations' | 'captures' | 'appointments'; currentValue: number }) => Promise<void>;
}

const CampaignLivePanel = ({
  campaign,
  participants,
  brokers,
  currentBrokerId,
  canManage,
  onStart,
  onPause,
  onResume,
  onFinish,
  onIncrement,
}: CampaignLivePanelProps) => {
  const [elapsed, setElapsed] = useState("00:00:00");

  // Timer
  useEffect(() => {
    if (campaign.status !== 'active' || !campaign.started_at) return;
    const startTime = new Date(campaign.started_at).getTime();
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [campaign.status, campaign.started_at]);

  // Totals
  const totals = useMemo(() => ({
    calls: participants.reduce((s, p) => s + p.calls, 0),
    negotiations: participants.reduce((s, p) => s + p.negotiations, 0),
    captures: participants.reduce((s, p) => s + p.captures, 0),
    appointments: participants.reduce((s, p) => s + p.appointments, 0),
  }), [participants]);

  const callsProgress = campaign.meta_calls > 0
    ? Math.min(100, Math.round((totals.calls / campaign.meta_calls) * 100))
    : 0;

  // Sorted by calls desc for ranking
  const ranked = useMemo(() => {
    return [...participants]
      .sort((a, b) => b.calls - a.calls)
      .map((p, i) => ({
        ...p,
        rank: i + 1,
        broker: brokers.find(b => b.id === p.broker_id),
      }));
  }, [participants, brokers]);

  const currentParticipant = participants.find(p => p.broker_id === currentBrokerId);
  const isActive = campaign.status === 'active';
  const isPaused = campaign.status === 'paused';
  const isDraft = campaign.status === 'draft';
  const isFinished = campaign.status === 'finished';

  const statusBadge = () => {
    switch (campaign.status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 animate-pulse">🔴 AO VIVO</Badge>;
      case 'paused': return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">⏸ Pausada</Badge>;
      case 'draft': return <Badge className="bg-muted text-muted-foreground">Rascunho</Badge>;
      case 'finished': return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">✅ Finalizada</Badge>;
      default: return null;
    }
  };

  const counterFields = [
    { key: 'calls' as const, label: 'Ligações', icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { key: 'negotiations' as const, label: 'Negociações', icon: Handshake, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { key: 'captures' as const, label: 'Captações', icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { key: 'appointments' as const, label: 'Convites', icon: CalendarCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 border-amber-500/30">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{campaign.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge()}
                  {(isActive || isPaused) && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {elapsed}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {canManage && (
              <div className="flex gap-2">
                {isDraft && (
                  <Button onClick={() => onStart(campaign.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Play className="w-4 h-4 mr-1" /> Iniciar
                  </Button>
                )}
                {isActive && (
                  <>
                    <Button variant="outline" onClick={() => onPause(campaign.id)} className="border-yellow-500/50 text-yellow-600">
                      <Pause className="w-4 h-4 mr-1" /> Pausar
                    </Button>
                    <Button variant="destructive" onClick={() => onFinish(campaign.id)}>
                      <Square className="w-4 h-4 mr-1" /> Finalizar
                    </Button>
                  </>
                )}
                {isPaused && (
                  <>
                    <Button onClick={() => onResume(campaign.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      <Play className="w-4 h-4 mr-1" /> Retomar
                    </Button>
                    <Button variant="destructive" onClick={() => onFinish(campaign.id)}>
                      <Square className="w-4 h-4 mr-1" /> Finalizar
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        {/* KPIs */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {counterFields.map(({ key, label, icon: Icon, color, bg }) => (
              <div key={key} className="bg-card/80 rounded-xl p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("p-1.5 rounded-lg", bg)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{label}</span>
                </div>
                <p className="text-2xl font-black text-foreground">{totals[key]}</p>
              </div>
            ))}
          </div>

          {/* Progress bar for calls meta */}
          {campaign.meta_calls > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Meta de ligações</span>
                <span className="font-semibold">{totals.calls} / {campaign.meta_calls} ({callsProgress}%)</span>
              </div>
              <Progress value={callsProgress} className="h-2.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* My counters (for brokers) */}
      {currentParticipant && (isActive || isPaused) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              ⭐ Meus Contadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {counterFields.map(({ key, label, icon: Icon, color, bg }) => (
                <div key={key} className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border/50">
                  <div className={cn("p-1.5 rounded-lg", bg)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xl font-black">{currentParticipant[key]}</span>
                  <Button
                    size="sm"
                    disabled={!isActive}
                    onClick={() => onIncrement({
                      participantId: currentParticipant.id,
                      field: key,
                      currentValue: currentParticipant[key],
                    })}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> +1
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Ranking ao Vivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ranked.map((p) => {
              const isMe = p.broker_id === currentBrokerId;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    isMe ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-card/50 border-border/50",
                    p.rank === 1 && "bg-amber-500/5 border-amber-500/30"
                  )}
                >
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black",
                    p.rank === 1 ? "bg-amber-500 text-white" :
                    p.rank === 2 ? "bg-gray-300 text-gray-800" :
                    p.rank === 3 ? "bg-amber-700 text-white" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {p.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {p.broker?.name || 'Corretor'}
                      {isMe && <Badge className="ml-2 text-[10px] bg-primary/20 text-primary border-primary/30">VOCÊ</Badge>}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.calls}</span>
                    <span className="flex items-center gap-1"><Handshake className="w-3 h-3" /> {p.negotiations}</span>
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {p.captures}</span>
                    <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {p.appointments}</span>
                  </div>
                </div>
              );
            })}
            {ranked.length === 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">Nenhum participante adicionado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignLivePanel;
