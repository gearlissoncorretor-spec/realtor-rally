import Navigation from "@/components/Navigation";
import { RankingSkeleton } from "@/components/skeletons/RankingSkeleton";
import PeriodFilter from "@/components/PeriodFilter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy, TrendingUp, TrendingDown, Tv, Flame, Medal, Star, X,
  Volume2, VolumeX, Crown, Zap, Target, DollarSign, Users,
  ChevronUp, ChevronDown, Sparkles, Award, Building2, Settings
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { formatCurrency, formatCurrencyCompact } from "@/utils/formatting";
import { calculateGrowth } from "@/utils/calculations";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useSpotlightBroker } from "@/hooks/useSpotlightBroker";
import { useTVModeSound } from "@/components/TVModeSoundSettings";

// ===== TYPES =====
interface BrokerRanking {
  id: string;
  name: string;
  avatar: string;
  sales: number;
  revenue: number;
  position: number;
  growth: number | null;
  email: string;
  userId?: string | null;
  teamId?: string | null;
}

interface TeamRanking {
  id: string;
  name: string;
  totalVGV: number;
  totalSales: number;
  brokerCount: number;
  position: number;
}

type RankingType = 'vendas' | 'captacao';
type TVRankingMode = 'alternate' | 'vendas' | 'captacao';

// ===== MEDALS & ACHIEVEMENTS =====
const getAchievements = (broker: BrokerRanking, allBrokers: BrokerRanking[]) => {
  const badges: { icon: string; label: string; color: string }[] = [];
  if (broker.position === 1) badges.push({ icon: "🏆", label: "Campeão", color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400" });
  if (broker.sales >= 10) badges.push({ icon: "🚀", label: "10+ Vendas", color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400" });
  if (broker.sales >= 5) badges.push({ icon: "🔥", label: "5+ Vendas", color: "from-orange-500/20 to-red-500/10 border-orange-500/30 text-orange-400" });
  if (broker.revenue >= 1000000) badges.push({ icon: "💰", label: "1M+ VGV", color: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400" });
  const maxRevenue = Math.max(...allBrokers.map(b => b.revenue));
  if (broker.revenue === maxRevenue && maxRevenue > 0) badges.push({ icon: "⚡", label: "Maior VGV", color: "from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400" });
  if (broker.growth && broker.growth > 50) badges.push({ icon: "📈", label: "Crescimento 50%+", color: "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400" });
  return badges;
};

// XP System
const calculateXP = (broker: BrokerRanking) => {
  let xp = 0;
  xp += broker.sales * 500;
  xp += Math.floor(broker.revenue / 100000) * 100;
  if (broker.position === 1) xp += 1000;
  if (broker.position <= 3) xp += 500;
  return xp;
};

const getLevel = (xp: number) => {
  if (xp >= 10000) return { level: 10, title: "Lenda", color: "text-yellow-400" };
  if (xp >= 7500) return { level: 9, title: "Mestre", color: "text-purple-400" };
  if (xp >= 5000) return { level: 8, title: "Elite", color: "text-blue-400" };
  if (xp >= 3500) return { level: 7, title: "Veterano", color: "text-cyan-400" };
  if (xp >= 2500) return { level: 6, title: "Experiente", color: "text-emerald-400" };
  if (xp >= 1500) return { level: 5, title: "Avançado", color: "text-green-400" };
  if (xp >= 1000) return { level: 4, title: "Intermediário", color: "text-lime-400" };
  if (xp >= 500) return { level: 3, title: "Iniciante", color: "text-orange-400" };
  if (xp >= 100) return { level: 2, title: "Novato", color: "text-slate-400" };
  return { level: 1, title: "Recruta", color: "text-slate-500" };
};

// ===== PARTICLE EFFECTS =====
const ParticleEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "absolute rounded-full",
          i % 4 === 0 ? "w-1.5 h-1.5 bg-warning/30" :
          i % 4 === 1 ? "w-1 h-1 bg-primary/25" :
          i % 4 === 2 ? "w-1 h-1 bg-success/20" :
          "w-0.5 h-0.5 bg-info/30"
        )}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float-particle ${4 + Math.random() * 6}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }}
      />
    ))}
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={`glow-${i}`}
        className={cn(
          "absolute w-3 h-3 rounded-full blur-sm",
          i % 3 === 0 ? "bg-warning/15" : i % 3 === 1 ? "bg-primary/15" : "bg-destructive/10"
        )}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float-particle ${5 + Math.random() * 5}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 3}s`,
        }}
      />
    ))}
  </div>
);

// ===== SPOTLIGHT BROKER SIDEBAR =====
const SpotlightBrokerSidebar = ({
  broker,
  allBrokers,
  canManage,
  availableBrokers,
  onChangeBroker,
  isUpdating,
}: {
  broker: { id: string; name: string; avatar?: string; sales?: number; revenue?: number; position?: number } | null;
  allBrokers: BrokerRanking[];
  canManage: boolean;
  availableBrokers: { id: string; name: string }[];
  onChangeBroker: (brokerId: string | null) => void;
  isUpdating: boolean;
}) => {
  if (!broker && !canManage) return null;

  const brokerRankingData = broker ? allBrokers.find(b => b.id === broker.id) : null;
  const achievements = brokerRankingData ? getAchievements(brokerRankingData, allBrokers) : [];
  const xp = brokerRankingData ? calculateXP(brokerRankingData) : 0;
  const level = brokerRankingData ? getLevel(xp) : null;
  const initials = broker?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '';

  return (
    <Card className="relative overflow-hidden border-warning/20">
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--warning) / 0.15) 0%, hsl(var(--primary) / 0.1) 50%, hsl(var(--warning) / 0.15) 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 6s ease-in-out infinite',
          }}
        />
        {/* Floating orbs */}
        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-warning/10 blur-xl animate-pulse" />
        <div className="absolute bottom-8 left-4 w-12 h-12 rounded-full bg-primary/10 blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-bold text-foreground">Corretor Destaque</h3>
          <Star className="w-3 h-3 text-warning" />
        </div>

        {broker ? (
          <div className="flex flex-col items-center text-center">
            {/* Avatar with golden glow */}
            <div className="relative mb-3">
              <div className="absolute -inset-2 rounded-full bg-warning/20 blur-lg animate-pulse" />
              <Avatar className="w-20 h-20 ring-4 ring-warning/50 shadow-2xl relative z-10">
                <AvatarImage src={broker.avatar} alt={broker.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100 text-xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 z-20">
                <Crown className="w-6 h-6 text-warning drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              </div>
            </div>

            <p className="font-bold text-foreground text-base mb-0.5">{broker.name}</p>
            {level && (
              <Badge variant="outline" className={cn("text-[10px] mb-2", level.color)}>
                Nv.{level.level} {level.title}
              </Badge>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 w-full mb-3">
              <div className="bg-background/50 rounded-lg p-2">
                <p className="text-lg font-black text-foreground">{broker.sales ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Vendas</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2">
                <p className="text-sm font-black text-foreground">{formatCurrencyCompact(broker.revenue ?? 0)}</p>
                <p className="text-[10px] text-muted-foreground">VGV</p>
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {achievements.slice(0, 3).map((badge, i) => (
                  <span key={i} className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full border bg-gradient-to-r font-medium",
                    badge.color
                  )}>
                    {badge.icon} {badge.label}
                  </span>
                ))}
              </div>
            )}

            {/* Position badge */}
            {broker.position && (
              <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                #{broker.position} no Ranking
              </Badge>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum corretor selecionado</p>
          </div>
        )}

        {/* Manager can change spotlight */}
        {canManage && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <label className="text-[10px] text-muted-foreground block mb-1.5">Selecionar destaque:</label>
            <Select
              value={broker?.id || 'none'}
              onValueChange={(v) => onChangeBroker(v === 'none' ? null : v)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Escolher corretor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {availableBrokers.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
};

// ===== TEAM RANKING (DIRECTOR VIEW) =====
const TeamRankingSection = ({ teamRankings }: { teamRankings: TeamRanking[] }) => {
  if (teamRankings.length === 0) return null;

  const maxVGV = Math.max(...teamRankings.map(t => t.totalVGV), 1);

  return (
    <Card className="overflow-hidden border-border/50 mb-6">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground text-sm">Ranking por Equipe</h2>
        <Badge variant="secondary" className="ml-auto text-xs">{teamRankings.length} equipes</Badge>
      </div>
      <div className="p-3 space-y-2">
        {teamRankings.map((team) => {
          const barPct = (team.totalVGV / maxVGV) * 100;
          return (
            <div
              key={team.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                team.position === 1
                  ? "bg-warning/5 border-warning/20"
                  : "bg-card/50 border-border/50 hover:border-primary/20"
              )}
            >
              {/* Position */}
              {team.position === 1 ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 shrink-0">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">#{team.position}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{team.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{team.totalSales} vendas</span>
                  <span>{team.brokerCount} corretores</span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        team.position === 1 ? "bg-warning" : "bg-primary/60"
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* VGV */}
              <div className="text-right shrink-0">
                <p className={cn(
                  "font-bold text-sm",
                  team.position === 1 ? "text-warning" : "text-foreground"
                )}>
                  {formatCurrencyCompact(team.totalVGV)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ===== ANIMATED PODIUM =====
const AnimatedPodium = ({ brokers, currentUserId }: { brokers: BrokerRanking[]; currentUserId?: string }) => {
  const top3 = brokers.slice(0, 3);
  const podiumOrder = [
    top3.find(b => b.position === 2),
    top3.find(b => b.position === 1),
    top3.find(b => b.position === 3),
  ].filter(Boolean) as BrokerRanking[];

  if (podiumOrder.length === 0) return null;

  const podiumConfig = [
    { height: "h-32 md:h-40", avatarSize: "w-18 h-18 md:w-22 md:h-22", nameSize: "text-sm md:text-base", valueSize: "text-base md:text-lg", ring: "ring-slate-300/60", gradient: "from-slate-400/20 via-slate-400/10 to-transparent", border: "border-slate-400/30", numColor: "text-slate-300/60", numSize: "text-4xl md:text-5xl" },
    { height: "h-40 md:h-52", avatarSize: "w-22 h-22 md:w-28 md:h-28", nameSize: "text-base md:text-lg", valueSize: "text-lg md:text-xl", ring: "ring-yellow-400/70", gradient: "from-yellow-500/25 via-yellow-500/10 to-transparent", border: "border-yellow-400/40", numColor: "text-yellow-400/50", numSize: "text-5xl md:text-6xl" },
    { height: "h-24 md:h-32", avatarSize: "w-14 h-14 md:w-18 md:h-18", nameSize: "text-xs md:text-sm", valueSize: "text-sm md:text-base", ring: "ring-orange-400/50", gradient: "from-orange-500/20 via-orange-500/8 to-transparent", border: "border-orange-400/30", numColor: "text-orange-400/50", numSize: "text-3xl md:text-4xl" },
  ];

  return (
    <div className="relative mb-8">
      <ParticleEffect />
      <div className="flex items-end justify-center gap-3 md:gap-6 pt-8">
        {podiumOrder.map((broker, index) => {
          const config = podiumConfig[index];
          const isFirst = broker.position === 1;
          const isCurrentUser = broker.userId === currentUserId;
          const initials = broker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
          const xp = calculateXP(broker);
          const level = getLevel(xp);

          return (
            <div
              key={broker.id}
              className="flex flex-col items-center animate-fade-in"
              style={{ animationDelay: `${isFirst ? 0.4 : index === 0 ? 0.2 : 0.6}s` }}
            >
              {isFirst && (
                <div className="relative mb-1 animate-bounce" style={{ animationDuration: '2.5s' }}>
                  <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
                </div>
              )}

              <div className="relative mb-2">
                {isFirst && (
                  <div className="absolute -inset-3 rounded-full bg-yellow-400/15 blur-xl animate-pulse" />
                )}
                <Avatar className={cn(
                  config.avatarSize,
                  "ring-4 shadow-2xl transition-all relative z-10",
                  config.ring,
                  isCurrentUser && "ring-primary ring-offset-2 ring-offset-background"
                )}>
                  <AvatarImage src={broker.avatar} alt={broker.name} className="object-cover" />
                  <AvatarFallback className={cn(
                    "font-black",
                    isFirst ? "bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100 text-xl md:text-2xl" :
                    broker.position === 2 ? "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100 text-lg" :
                    "bg-gradient-to-br from-orange-600 to-orange-800 text-orange-100 text-sm"
                  )}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isCurrentUser && (
                  <div className="absolute -top-1 -right-1 z-20 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-lg">
                    VOCÊ
                  </div>
                )}
              </div>

              <p className={cn("font-bold text-center leading-tight text-foreground", config.nameSize)}>
                {broker.name.split(' ').slice(0, 2).join(' ')}
              </p>
              <p className="text-xs text-muted-foreground mb-0.5">{broker.sales} {broker.sales === 1 ? 'venda' : 'vendas'}</p>
              <Badge variant="outline" className={cn("text-[10px] mb-1", level.color)}>
                Nv.{level.level} {level.title}
              </Badge>
              <p className={cn(
                "font-black mb-2",
                config.valueSize,
                isFirst ? "text-warning drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "text-foreground"
              )}>
                {formatCurrencyCompact(broker.revenue)}
              </p>

              <div className={cn(
                "w-24 md:w-32 rounded-t-xl border-2 flex items-center justify-center relative overflow-hidden",
                config.height,
                `bg-gradient-to-t ${config.gradient}`,
                config.border
              )}>
                {isFirst && (
                  <div className="absolute inset-0 shimmer-effect" />
                )}
                <span className={cn("font-black", config.numColor, config.numSize)}>
                  {broker.position}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== STATS HEADER =====
const StatsHeader = ({ brokers }: { brokers: BrokerRanking[] }) => {
  const totalSales = brokers.reduce((sum, b) => sum + b.sales, 0);
  const totalVGV = brokers.reduce((sum, b) => sum + b.revenue, 0);
  const avgTicket = totalSales > 0 ? totalVGV / totalSales : 0;
  const topBroker = brokers[0];

  const stats = [
    { icon: Users, label: "Vendas Totais", value: totalSales.toString(), color: "text-primary", bg: "bg-primary/10", glow: "shadow-primary/5" },
    { icon: DollarSign, label: "VGV Total", value: formatCurrencyCompact(totalVGV), color: "text-success", bg: "bg-success/10", glow: "shadow-success/5" },
    { icon: Target, label: "Ticket Médio", value: formatCurrencyCompact(avgTicket), color: "text-info", bg: "bg-info/10", glow: "shadow-info/5" },
    { icon: Crown, label: "Líder do Período", value: topBroker?.name.split(' ')[0] || '-', color: "text-warning", bg: "bg-warning/10", glow: "shadow-warning/5" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className={cn(
            "p-3 md:p-4 border-border/50 hover:border-primary/30 transition-all relative overflow-hidden group",
            `shadow-lg ${stat.glow}`
          )}>
            <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity", 
              i === 0 ? "from-primary/60 to-primary/20" : 
              i === 1 ? "from-success/60 to-success/20" : 
              i === 2 ? "from-info/60 to-info/20" : 
              "from-warning/60 to-warning/20"
            )} />
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                <Icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
          </Card>
        );
      })}
    </div>
  );
};

// ===== LEADERBOARD CARD =====
const LeaderboardCard = ({
  broker,
  allBrokers,
  currentUserId,
  showProgressBar,
}: {
  broker: BrokerRanking;
  allBrokers: BrokerRanking[];
  currentUserId?: string;
  showProgressBar: boolean;
}) => {
  const isCurrentUser = broker.userId === currentUserId;
  const xp = calculateXP(broker);
  const level = getLevel(xp);
  const achievements = getAchievements(broker, allBrokers);
  const initials = broker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const brokerAbove = allBrokers.find(b => b.position === broker.position - 1);
  const gap = brokerAbove ? brokerAbove.revenue - broker.revenue : 0;
  const progressPct = brokerAbove ? Math.min((broker.revenue / brokerAbove.revenue) * 100, 100) : 100;

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 md:p-4 rounded-xl border transition-all group",
      isCurrentUser
        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
        : "bg-card/50 border-border/50 hover:border-primary/20 hover:bg-card/80"
    )}>
      <div className="flex items-center gap-3">
        <PositionBadge position={broker.position} />

        <Avatar className="h-10 w-10 ring-2 ring-border/50">
          <AvatarImage src={broker.avatar} className="object-cover" />
          <AvatarFallback className="text-xs font-bold bg-muted">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-foreground truncate">{broker.name}</p>
            {isCurrentUser && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">⭐ VOCÊ</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{broker.sales} {broker.sales === 1 ? 'venda' : 'vendas'}</span>
            <Badge variant="outline" className={cn("text-[9px] px-1 py-0", level.color)}>
              Nv.{level.level}
            </Badge>
          </div>
        </div>

        <div className="text-right">
          <p className="font-bold text-sm text-foreground">{formatCurrency(broker.revenue)}</p>
          {broker.growth !== null && (
            <div className="flex items-center justify-end gap-0.5">
              {broker.growth > 0 ? (
                <ChevronUp className="w-3 h-3 text-success" />
              ) : (
                <ChevronDown className="w-3 h-3 text-destructive" />
              )}
              <span className={cn("text-xs font-medium", broker.growth > 0 ? "text-success" : "text-destructive")}>
                {broker.growth > 0 ? '+' : ''}{broker.growth.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-[52px]">
          {achievements.slice(0, 3).map((badge, i) => (
            <span key={i} className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full border bg-gradient-to-r font-medium",
              badge.color
            )}>
              {badge.icon} {badge.label}
            </span>
          ))}
        </div>
      )}

      {showProgressBar && brokerAbove && gap > 0 && (
        <div className="ml-[52px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-muted-foreground">
              Faltam {formatCurrencyCompact(gap)} para #{broker.position - 1}
            </span>
            <span className="text-[10px] text-muted-foreground">{progressPct.toFixed(0)}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
      )}
    </div>
  );
};

// ===== POSITION BADGE =====
const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 shrink-0">
      <Trophy className="w-4 h-4 text-white" />
    </div>
  );
  if (position === 2) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md shrink-0">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  if (position === 3) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shrink-0">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-muted-foreground">#{position}</span>
    </div>
  );
};

// ===== TEAM FILTER =====
const TeamFilter = ({
  teams,
  selectedTeam,
  onTeamChange,
}: {
  teams: { id: string; name: string }[];
  selectedTeam: string;
  onTeamChange: (t: string) => void;
}) => (
  <div className="flex flex-wrap gap-2 mb-4">
    <Button
      variant={selectedTeam === 'all' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onTeamChange('all')}
      className="text-xs h-8"
    >
      <Users className="w-3 h-3 mr-1" />
      Geral
    </Button>
    {teams.map(team => (
      <Button
        key={team.id}
        variant={selectedTeam === team.id ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTeamChange(team.id)}
        className="text-xs h-8"
      >
        {team.name}
      </Button>
    ))}
  </div>
);

// ===== QUICK PERIOD BUTTONS =====
const QuickPeriodButtons = ({
  activePeriod,
  onPeriodChange,
}: {
  activePeriod: string;
  onPeriodChange: (p: string) => void;
}) => {
  const periods = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mês' },
    { key: 'year', label: 'Ano' },
    { key: 'all', label: 'Histórico' },
  ];

  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      {periods.map(p => (
        <Button
          key={p.key}
          variant={activePeriod === p.key ? 'default' : 'ghost'}
          size="sm"
          className="text-xs h-7 px-3"
          onClick={() => onPeriodChange(p.key)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
};

// ===== CONFETTI =====
const ConfettiCanvas = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899'];
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; rotation: number; rotSpeed: number; life: number;
    }> = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 1,
      });
    }
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height + 20) { p.life = 0; return; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (alive) animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

// ===== SOUNDS =====
const useRankingSounds = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const { soundUrl: customSoundUrl } = useTVModeSound();

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }, []);

  // Play custom uploaded sound if available
  const playCustomSound = useCallback(() => {
    if (!soundEnabled || !customSoundUrl) return false;
    try {
      if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.currentTime = 0;
      }
      customAudioRef.current = new Audio(customSoundUrl);
      customAudioRef.current.volume = 0.7;
      customAudioRef.current.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }, [soundEnabled, customSoundUrl]);

  const stopCustomSound = useCallback(() => {
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
    }
  }, []);

  const playVictory = useCallback(() => {
    if (!soundEnabled) return;
    if (playCustomSound()) return; // Use custom sound if available
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.6);
    });
  }, [soundEnabled, getCtx, playCustomSound]);

  const playReveal = useCallback(() => {
    if (!soundEnabled) return;
    if (customSoundUrl) return; // Skip procedural sound if custom is playing
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }, [soundEnabled, getCtx, customSoundUrl]);

  const playCelebration = useCallback(() => {
    if (!soundEnabled) return;
    if (playCustomSound()) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 4 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }, [soundEnabled, getCtx, playCustomSound]);

  return { playVictory, playReveal, playCelebration, soundEnabled, setSoundEnabled, stopCustomSound };
};

// ===== SALE CELEBRATION OVERLAY =====
const SaleCelebrationOverlay = ({
  sale,
  broker,
  onDismiss,
}: {
  sale: { clientName: string; value: number };
  broker: BrokerRanking | null;
  onDismiss: () => void;
}) => {
  const initials = broker?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center" onClick={onDismiss}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Celebration content */}
      <div className="relative z-10 text-center animate-scale-in max-w-lg mx-auto px-6">
        {/* Glow ring */}
        <div className="absolute inset-0 -m-20 rounded-full bg-yellow-400/10 blur-[80px] animate-pulse" />

        {/* Trophy icon */}
        <div className="mb-4 relative inline-block">
          <div className="absolute -inset-4 rounded-full bg-yellow-400/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/40">
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">
          🎉 NOVA VENDA! 🎉
        </h2>

        {/* Broker info */}
        {broker && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <Avatar className="w-14 h-14 ring-4 ring-yellow-400/50 shadow-xl">
              <AvatarImage src={broker.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100 text-lg font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-xl font-bold text-white">{broker.name}</p>
              <p className="text-sm text-yellow-300/70">#{broker.position} no ranking</p>
            </div>
          </div>
        )}

        {/* Sale details */}
        <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/[0.1] p-5 mb-4">
          <p className="text-sm text-blue-200/60 mb-1">Cliente</p>
          <p className="text-lg font-semibold text-white mb-3">{sale.clientName}</p>
          <p className="text-sm text-blue-200/60 mb-1">Valor da Venda</p>
          <p className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
            {formatCurrency(sale.value)}
          </p>
        </div>

        {/* Motivational text */}
        <p className="text-lg text-white/60 font-medium">
          Parabéns! Você é imparável! 🔥
        </p>
      </div>
    </div>
  );
};

// ===== LIVE CLOCK =====
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="text-right">
      <p className="text-2xl font-mono font-bold text-white/90 tracking-wider">{time}</p>
      <p className="text-xs text-white/40 capitalize">{date}</p>
    </div>
  );
};

// ===== TV KPI STATS =====
const TVStatsBar = ({ brokers }: { brokers: BrokerRanking[] }) => {
  const totalSales = brokers.reduce((sum, b) => sum + b.sales, 0);
  const totalVGV = brokers.reduce((sum, b) => sum + b.revenue, 0);
  const avgTicket = totalSales > 0 ? totalVGV / totalSales : 0;
  const topBroker = brokers[0];

  const stats = [
    { icon: Users, label: "Vendas", value: totalSales.toString(), color: "from-blue-400 to-blue-600" },
    { icon: DollarSign, label: "VGV Total", value: formatCurrencyCompact(totalVGV), color: "from-emerald-400 to-emerald-600" },
    { icon: Target, label: "Ticket Médio", value: formatCurrencyCompact(avgTicket), color: "from-cyan-400 to-cyan-600" },
    { icon: Crown, label: "Líder", value: topBroker?.name.split(' ')[0] || '-', color: "from-yellow-400 to-amber-500" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="relative overflow-hidden rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] p-3">
            <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r", stat.color)} />
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-white/50" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-xl font-black text-white">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};

// ===== RECENT SALES TICKER =====
const RecentSalesTicker = ({ sales, brokers }: { sales: any[]; brokers: BrokerRanking[] }) => {
  const recentSales = useMemo(() => {
    return sales
      .filter(s => s.status !== 'cancelada' && s.status !== 'distrato')
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 10)
      .map(s => {
        const broker = brokers.find(b => b.id === s.broker_id);
        return {
          id: s.id,
          brokerName: broker?.name || s.vendedor || 'Corretor',
          clientName: s.client_name,
          value: Number(s.vgv || s.property_value || 0),
          date: s.sale_date || s.created_at,
        };
      });
  }, [sales, brokers]);

  if (recentSales.length === 0) return null;

  return (
    <div className="relative overflow-hidden h-10 bg-white/[0.04] border-t border-white/[0.06] backdrop-blur-sm">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#030712] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#030712] to-transparent z-10" />
      <div className="flex items-center h-full animate-[ticker_30s_linear_infinite] whitespace-nowrap">
        {[...recentSales, ...recentSales].map((sale, i) => (
          <div key={`${sale.id}-${i}`} className="flex items-center gap-3 px-6">
            <span className="text-yellow-400 text-xs">🏆</span>
            <span className="text-white/70 text-xs font-medium">{sale.brokerName}</span>
            <span className="text-white/30 text-xs">→</span>
            <span className="text-white/50 text-xs">{sale.clientName}</span>
            <span className="text-emerald-400 text-xs font-bold">{formatCurrencyCompact(sale.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== TV MODE =====
const RankingTVMode = ({ brokerRankings, captacaoRankings, onClose, sales, tvRankingMode }: { brokerRankings: BrokerRanking[]; captacaoRankings: BrokerRanking[]; onClose: () => void; sales: any[]; tvRankingMode: TVRankingMode }) => {
  const { settings } = useOrganizationSettings();
  const { playVictory, playReveal, playCelebration, soundEnabled, setSoundEnabled, stopCustomSound } = useRankingSounds();
  const [revealedCount, setRevealedCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'reveal' | 'complete'>('intro');
  const [viewMode, setViewMode] = useState<'full' | 'podium'>('full');
  const [celebratingSale, setCelebratingSale] = useState<{ clientName: string; value: number; brokerId: string | null } | null>(null);
  const [activeRankingType, setActiveRankingType] = useState<RankingType>(tvRankingMode === 'captacao' ? 'captacao' : 'vendas');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastSaleCountRef = useRef(sales.length);

  const currentRankings = activeRankingType === 'captacao' ? captacaoRankings : brokerRankings;
  const top3 = currentRankings.slice(0, 3);
  const rest = viewMode === 'full' ? currentRankings.slice(3, 10) : [];
  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;
  const orgName = settings?.organization_name || 'Ranking';

  // Auto-alternate rankings with smooth transition
  useEffect(() => {
    if (tvRankingMode !== 'alternate') return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveRankingType(prev => prev === 'vendas' ? 'captacao' : 'vendas');
        setPhase('intro');
        setRevealedCount(0);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 500);
    }, 20000);
    return () => clearInterval(interval);
  }, [tvRankingMode]);

  // Detect new sales in real-time
  useEffect(() => {
    if (sales.length > lastSaleCountRef.current) {
      const newSale = sales[sales.length - 1];
      if (newSale) {
        setCelebratingSale({
          clientName: newSale.client_name || 'Cliente',
          value: Number(newSale.property_value || 0),
          brokerId: newSale.broker_id || null,
        });
        setShowConfetti(true);
        playCelebration();
        setTimeout(() => setShowConfetti(false), 6000);
      }
    }
    lastSaleCountRef.current = sales.length;
  }, [sales.length, playCelebration]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('reveal'), 1500);
    return () => clearTimeout(timer);
  }, [activeRankingType]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    const totalToReveal = rest.length + top3.length;
    const revealNext = (i: number) => {
      if (i >= totalToReveal) {
        setPhase('complete');
        setShowConfetti(true);
        playVictory();
        setTimeout(() => setShowConfetti(false), 5000);
        return;
      }
      setTimeout(() => {
        setRevealedCount(i + 1);
        if (i >= rest.length) playReveal();
        revealNext(i + 1);
      }, i < rest.length ? 400 : 800);
    };
    revealNext(0);
  }, [phase]);

  // ESC key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const podiumOrder = [
    top3.find(b => b.position === 2),
    top3.find(b => b.position === 1),
    top3.find(b => b.position === 3),
  ].filter(Boolean) as BrokerRanking[];

  const isRevealed = (position: number) => {
    if (phase === 'complete') return true;
    if (position > 3) return (position - 4) < revealedCount;
    return (rest.length + (3 - position)) < revealedCount;
  };

  const celebratingBroker = celebratingSale
    ? currentRankings.find(b => b.id === celebratingSale.brokerId) || null
    : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030712] text-white overflow-hidden flex flex-col">
      <ConfettiCanvas active={showConfetti} />

      {/* Sale celebration overlay */}
      {celebratingSale && (
        <SaleCelebrationOverlay
          sale={celebratingSale}
          broker={celebratingBroker}
          onDismiss={() => setCelebratingSale(null)}
        />
      )}

      {/* Animated BG - Ultra vibrant */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-[150px]" style={{ animation: 'orb-float 12s ease-in-out infinite' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full bg-amber-500/20 blur-[150px]" style={{ animation: 'orb-float 10s ease-in-out infinite', animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-600/18 blur-[130px]" style={{ animation: 'orb-float 14s ease-in-out infinite', animationDelay: '4s' }} />
        <div className="absolute bottom-[15%] left-[10%] w-[550px] h-[550px] rounded-full bg-emerald-500/18 blur-[130px]" style={{ animation: 'orb-float 11s ease-in-out infinite', animationDelay: '1s' }} />
        <div className="absolute top-[5%] left-[35%] w-[500px] h-[500px] rounded-full bg-pink-500/15 blur-[120px]" style={{ animation: 'orb-float 13s ease-in-out infinite', animationDelay: '3s' }} />
        <div className="absolute bottom-[5%] right-[25%] w-[450px] h-[450px] rounded-full bg-cyan-400/15 blur-[110px]" style={{ animation: 'orb-float 9s ease-in-out infinite', animationDelay: '5s' }} />
        <div className="absolute top-[45%] left-[50%] w-[400px] h-[400px] rounded-full bg-rose-500/12 blur-[100px]" style={{ animation: 'orb-float 15s ease-in-out infinite', animationDelay: '6s' }} />

        <div className="absolute inset-0 opacity-[0.08]" style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(168,85,247,0.3) 20%, rgba(236,72,153,0.3) 40%, rgba(251,191,36,0.4) 60%, rgba(16,185,129,0.3) 80%, rgba(6,182,212,0.3) 100%)',
          backgroundSize: '600% 600%',
          animation: 'gradient-shift 10s ease-in-out infinite',
        }} />

        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        {Array.from({ length: 70 }).map((_, i) => {
          const colors = [
            'bg-yellow-400/50', 'bg-blue-400/45', 'bg-purple-400/40', 'bg-emerald-400/45',
            'bg-pink-400/40', 'bg-cyan-400/40', 'bg-rose-400/35', 'bg-amber-400/45',
            'bg-indigo-400/35', 'bg-teal-400/40',
          ];
          const sizes = ['w-2 h-2', 'w-1.5 h-1.5', 'w-1 h-1', 'w-0.5 h-0.5'];
          return (
            <div key={i} className={cn(
              "absolute rounded-full",
              colors[i % colors.length],
              sizes[i % sizes.length]
            )} style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              animation: `float-particle ${4 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 6}s`,
            }} />
          );
        })}

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`star-${i}`} className="absolute w-[2px] h-[80px] rounded-full" style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0))',
            left: `${20 + i * 15}%`,
            top: '-80px',
            animation: `shooting-star ${3 + i * 1.5}s linear infinite`,
            animationDelay: `${i * 2.5}s`,
            transform: 'rotate(35deg)',
          }} />
        ))}
      </div>

      {/* Top bar: controls + clock */}
      <div className="relative z-50 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          {/* Ranking type indicator pill */}
          {tvRankingMode === 'alternate' && (
            <div className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/[0.08]">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors duration-500",
                activeRankingType === 'vendas' ? "bg-blue-400" : "bg-emerald-400"
              )} />
              <span className="text-xs text-white/60 font-medium">
                {activeRankingType === 'vendas' ? 'Vendas' : 'Captação'}
              </span>
              <span className="text-[10px] text-white/25 ml-1">auto</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LiveClock />
          <div className="flex items-center bg-white/[0.08] backdrop-blur-sm rounded-xl p-0.5 border border-white/[0.1]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('full')}
              className={cn("text-xs h-7 px-3 rounded-lg", viewMode === 'full' ? "bg-white/15 text-white shadow-inner" : "text-white/40 hover:text-white")}
            >
              Completo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('podium')}
              className={cn("text-xs h-7 px-3 rounded-lg", viewMode === 'podium' ? "bg-white/15 text-white shadow-inner" : "text-white/40 hover:text-white")}
            >
              Pódio
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content with transition */}
      <div className={cn(
        "relative z-10 flex-1 flex flex-col px-6 lg:px-10 pb-0 transition-all duration-500",
        isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      )}>
        {/* Header */}
        <div className={cn(
          "text-center mb-4 transition-all duration-1000",
          phase === 'intro' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        )}>
          <div className="flex items-center justify-center gap-4 mb-3">
            {effectiveLogo ? (
              <img src={effectiveLogo} alt={orgName} className="w-12 h-12 object-contain rounded-xl shadow-lg shadow-primary/30" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="text-left">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-sm">
                {activeRankingType === 'captacao' ? 'RANKING DE CAPTAÇÃO' : 'RANKING DE VENDAS'}
              </h1>
              <p className="text-sm text-cyan-300/70 font-medium tracking-[0.3em] uppercase">{orgName}</p>
            </div>
          </div>
          <div className="h-[3px] max-w-3xl mx-auto rounded-full overflow-hidden">
            <div className="h-full w-full" style={{
              background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), rgba(236,72,153,0.6), rgba(59,130,246,0.6), rgba(16,185,129,0.6), transparent)',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 4s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* KPI Stats Bar */}
        {phase === 'complete' && (
          <div className="animate-fade-in">
            <TVStatsBar brokers={currentRankings} />
          </div>
        )}

        {/* Podium */}
        <div className={cn("flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full", viewMode === 'podium' && "items-center")}>
          <div className={cn("flex items-end justify-center mb-8", viewMode === 'podium' ? "gap-6 lg:gap-14" : "gap-4 lg:gap-8")}>
            {podiumOrder.map((broker, index) => {
              const isFirst = broker.position === 1;
              const revealed = isRevealed(broker.position);
              const podiumHeights = viewMode === 'podium'
                ? ['h-44 lg:h-56', 'h-56 lg:h-72', 'h-36 lg:h-44']
                : ['h-36 lg:h-44', 'h-48 lg:h-56', 'h-28 lg:h-36'];
              const avatarSizes = viewMode === 'podium'
                ? ['w-24 h-24 lg:w-32 lg:h-32', 'w-32 h-32 lg:w-40 lg:h-40', 'w-20 h-20 lg:w-28 lg:h-28']
                : ['w-20 h-20 lg:w-24 lg:h-24', 'w-24 h-24 lg:w-32 lg:h-32', 'w-16 h-16 lg:w-20 lg:h-20'];

              const podiumGradients = [
                'from-slate-400/25 via-slate-400/15 to-transparent border-slate-300/40',
                'from-yellow-500/30 via-amber-500/15 to-transparent border-yellow-400/50',
                'from-orange-500/25 via-orange-500/12 to-transparent border-orange-400/40',
              ];
              const ringColors = [
                'ring-slate-300/60 shadow-slate-400/30',
                'ring-yellow-400/80 shadow-yellow-500/50',
                'ring-orange-400/60 shadow-orange-500/30',
              ];

              const initials = broker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
              const xp = calculateXP(broker);
              const level = getLevel(xp);

              return (
                <div key={broker.id} className={cn(
                  "flex flex-col items-center transition-all duration-700",
                  revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )} style={{ transitionDelay: revealed ? `${index * 200}ms` : '0ms' }}>
                  {isFirst && revealed && (
                    <div className="mb-2 animate-bounce" style={{ animationDuration: '2s' }}>
                      <Crown className={cn(
                        "text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.7)]",
                        viewMode === 'podium' ? "w-14 h-14" : "w-10 h-10"
                      )} />
                    </div>
                  )}
                  <div className="relative mb-3">
                    {isFirst && revealed && (
                      <div className="absolute -inset-4 rounded-full blur-2xl animate-pulse" style={{
                        background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0) 70%)',
                      }} />
                    )}
                    <Avatar className={cn(avatarSizes[index], "ring-4 shadow-2xl relative z-10", ringColors[index])}>
                      <AvatarImage src={broker.avatar} alt={broker.name} className="object-cover" />
                      <AvatarFallback className={cn(
                        "font-black",
                        isFirst ? "bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100 text-xl md:text-2xl" :
                        broker.position === 2 ? "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100 text-lg" :
                        "bg-gradient-to-br from-orange-600 to-orange-800 text-orange-100 text-sm"
                      )}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <p className={cn(
                    "font-bold text-center leading-tight text-white",
                    viewMode === 'podium' ? "text-base lg:text-lg" : "text-sm lg:text-base"
                  )}>
                    {broker.name.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <p className="text-xs text-blue-200/60 mb-0.5">{broker.sales} {broker.sales === 1 ? 'venda' : 'vendas'}</p>
                  <Badge variant="outline" className={cn("text-[10px] mb-1 border-white/20", level.color)}>
                    Nv.{level.level} {level.title}
                  </Badge>
                  <p className={cn(
                    "font-black mb-2",
                    viewMode === 'podium' ? "text-lg lg:text-xl" : "text-base lg:text-lg",
                    isFirst ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "text-white"
                  )}>
                    {formatCurrencyCompact(broker.revenue)}
                  </p>

                  <div className={cn(
                    "w-24 md:w-32 rounded-t-xl border-2 flex items-center justify-center relative overflow-hidden",
                    podiumHeights[index],
                    `bg-gradient-to-t ${podiumGradients[index]}`
                  )}>
                    {isFirst && <div className="absolute inset-0 shimmer-effect" />}
                    <div className={cn("absolute bottom-0 left-0 right-0 h-1/2 blur-2xl",
                      isFirst ? "bg-yellow-500/15" : broker.position === 2 ? "bg-slate-400/10" : "bg-orange-500/10"
                    )} />
                    <span className={cn("font-black relative z-10",
                      isFirst ? "text-7xl text-yellow-400/50" : "text-5xl text-white/15"
                    )}>{broker.position}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Podium-only mode: compact list */}
          {viewMode === 'podium' && currentRankings.length > 3 && phase === 'complete' && (
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto mt-4 animate-fade-in">
              {currentRankings.slice(3).map((broker, i) => {
                const chipColors = [
                  'from-blue-500/10 to-blue-500/5 border-blue-400/20',
                  'from-purple-500/10 to-purple-500/5 border-purple-400/20',
                  'from-emerald-500/10 to-emerald-500/5 border-emerald-400/20',
                  'from-pink-500/10 to-pink-500/5 border-pink-400/20',
                  'from-cyan-500/10 to-cyan-500/5 border-cyan-400/20',
                ];
                return (
                  <div key={broker.id} className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r border backdrop-blur-sm",
                    chipColors[i % chipColors.length]
                  )}>
                    <span className="text-sm font-black text-white/35">#{broker.position}</span>
                    <Avatar className="h-8 w-8 ring-1 ring-white/10">
                      <AvatarImage src={broker.avatar} />
                      <AvatarFallback className="text-[10px] bg-slate-700 text-slate-200 font-bold">
                        {broker.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/75 font-semibold">{broker.name.split(' ')[0]}</span>
                    <span className="text-xs text-blue-300/60 font-bold">{formatCurrencyCompact(broker.revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full mode: detailed list */}
          {viewMode === 'full' && rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-w-5xl mx-auto w-full">
              {rest.map((broker, idx) => {
                const revealed = isRevealed(broker.position);
                const cardColors = [
                  'hover:border-blue-400/30 hover:bg-blue-500/[0.06]',
                  'hover:border-purple-400/30 hover:bg-purple-500/[0.06]',
                  'hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]',
                  'hover:border-pink-400/30 hover:bg-pink-500/[0.06]',
                  'hover:border-cyan-400/30 hover:bg-cyan-500/[0.06]',
                  'hover:border-amber-400/30 hover:bg-amber-500/[0.06]',
                  'hover:border-rose-400/30 hover:bg-rose-500/[0.06]',
                ];
                return (
                  <div key={broker.id} className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl backdrop-blur-sm border bg-white/[0.04] border-white/[0.08] transition-all duration-500",
                    cardColors[idx % cardColors.length],
                    revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  )} style={{ transitionDelay: `${idx * 100}ms` }}>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/[0.08] to-white/[0.03] flex items-center justify-center shrink-0 border border-white/[0.06]">
                      <span className="text-sm font-black text-white/45">#{broker.position}</span>
                    </div>
                    <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/10">
                      <AvatarImage src={broker.avatar} />
                      <AvatarFallback className="text-xs bg-slate-700 text-slate-200 font-bold">
                        {broker.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{broker.name}</p>
                      <p className="text-xs text-blue-300/60">{broker.sales} vendas</p>
                    </div>
                    <p className="font-bold text-sm text-blue-200 whitespace-nowrap">{formatCurrency(broker.revenue)}</p>
                  </div>
                );
              })}
            </div>
          )}

          {currentRankings.length === 0 && (
            <div className="text-center py-20">
              <Star className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-lg">Nenhum dado para exibir</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Recent sales ticker */}
      <div className="relative z-10">
        <RecentSalesTicker sales={sales} brokers={brokerRankings} />
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-40px) scale(1.8); opacity: 0.6; }
        }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.05); }
          50% { transform: translate(-20px, 30px) scale(0.95); }
          75% { transform: translate(15px, 15px) scale(1.02); }
        }
        @keyframes shooting-star {
          0% { transform: rotate(35deg) translateY(-100vh); opacity: 0; }
          5% { opacity: 1; }
          15% { opacity: 1; }
          20% { transform: rotate(35deg) translateY(100vh); opacity: 0; }
          100% { transform: rotate(35deg) translateY(100vh); opacity: 0; }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

// ===== MAIN PAGE =====
const Ranking = () => {
  const { brokers, sales, brokersLoading, salesLoading } = useData();
  const { user, isDiretor, isAdmin, isGerente, getUserRole, profile } = useAuth();
  const { teams } = useTeams();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [isTVMode, setIsTVMode] = useState(false);
  const [quickPeriod, setQuickPeriod] = useState('month');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [rankingType, setRankingType] = useState<RankingType>('vendas');
  const [tvRankingMode, setTVRankingMode] = useState<TVRankingMode>('alternate');
  const { soundEnabled, setSoundEnabled, playVictory, stopCustomSound } = useRankingSounds();
  const { settings } = useOrganizationSettings();
  const { spotlightBrokerId, setSpotlightBroker, isUpdating: spotlightUpdating } = useSpotlightBroker();

  // Role-based header
  const headerInfo = useMemo(() => {
    const role = getUserRole();
    if (role === 'diretor' || role === 'admin' || role === 'super_admin') {
      return {
        title: settings?.organization_name || 'Ranking de Vendas',
        subtitle: 'Visão geral de todas as equipes',
      };
    }
    if (role === 'gerente' && profile?.team_id) {
      const team = teams.find(t => t.id === profile.team_id);
      return {
        title: team?.name || 'Ranking da Equipe',
        subtitle: 'Performance da sua equipe',
      };
    }
    return {
      title: 'Ranking de Vendas',
      subtitle: 'Performance e classificação',
    };
  }, [getUserRole, settings, profile, teams]);

  // Can manage spotlight
  const canManageSpotlight = isDiretor() || isAdmin() || isGerente();

  // Build teams list with real names
  const teamsForFilter = useMemo(() => {
    return teams.map(t => ({ id: t.id, name: t.name }));
  }, [teams]);

  // Filter sales by quick period or month/year
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      if (quickPeriod === 'today') return saleDate.toDateString() === now.toDateString();
      if (quickPeriod === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (quickPeriod === 'year') return saleDate.getFullYear() === now.getFullYear();
      if (quickPeriod === 'all') return true;

      // Default 'month' mode: if no specific month/year selected, use current month
      const filterMonth = selectedMonth > 0 ? selectedMonth : now.getMonth() + 1;
      const filterYear = selectedYear > 0 ? selectedYear : now.getFullYear();
      return saleDate.getMonth() + 1 === filterMonth && saleDate.getFullYear() === filterYear;
    });
  }, [sales, selectedMonth, selectedYear, quickPeriod]);

  const brokerRankings: BrokerRanking[] = useMemo(() => {
    let filteredBrokers = brokers;
    if (selectedTeam !== 'all') {
      filteredBrokers = brokers.filter(b => b.team_id === selectedTeam);
    }

    return filteredBrokers
      .filter(broker => broker.status === 'ativo')
      .map(broker => {
        const brokerSales = filteredSales.filter(sale => 
          sale.broker_id === broker.id && 
          sale.status !== 'cancelada' && 
          sale.status !== 'distrato'
        );
        const totalRevenue = brokerSales.reduce((sum, sale) => sum + Number(sale.vgv || sale.property_value || 0), 0);
        return {
          id: broker.id,
          name: broker.name,
          avatar: broker.avatar_url || '',
          sales: brokerSales.length,
          revenue: totalRevenue,
          position: 0,
          growth: calculateGrowth(broker.id, sales),
          email: broker.email,
          userId: broker.user_id,
          teamId: broker.team_id,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
      .map((b, i) => ({ ...b, position: i + 1 }));
  }, [brokers, filteredSales, sales, selectedTeam]);

  // Captação rankings - based on captador field
  const captacaoRankings: BrokerRanking[] = useMemo(() => {
    const captadorMap = new Map<string, { name: string; count: number; vgv: number }>();
    
    filteredSales.forEach(sale => {
      if (!sale.captador || sale.captador.trim() === '') return;
      if (sale.status === 'cancelada' || sale.status === 'distrato') return;
      const captador = sale.captador.trim();
      const existing = captadorMap.get(captador) || { name: captador, count: 0, vgv: 0 };
      existing.count += 1;
      existing.vgv += Number(sale.vgv || sale.property_value || 0);
      captadorMap.set(captador, existing);
    });

    // Try to match captador names to brokers for avatar/id
    return Array.from(captadorMap.values())
      .sort((a, b) => b.vgv - a.vgv || b.count - a.count)
      .map((cap, i) => {
        const matchedBroker = brokers.find(b => 
          b.name.toLowerCase() === cap.name.toLowerCase()
        );
        return {
          id: matchedBroker?.id || cap.name,
          name: cap.name,
          avatar: matchedBroker?.avatar_url || '',
          sales: cap.count,
          revenue: cap.vgv,
          position: i + 1,
          growth: null,
          email: matchedBroker?.email || '',
          userId: matchedBroker?.user_id || null,
          teamId: matchedBroker?.team_id || null,
        };
      });
  }, [filteredSales, brokers]);

  // Team rankings (for directors)
  const teamRankings: TeamRanking[] = useMemo(() => {
    if (!isDiretor() && !isAdmin()) return [];

    return teams.map(team => {
      const teamBrokers = brokers.filter(b => b.team_id === team.id);
      const teamBrokerIds = teamBrokers.map(b => b.id);
      const teamSales = filteredSales.filter(s => 
        teamBrokerIds.includes(s.broker_id || '') && 
        s.status !== 'cancelada' && 
        s.status !== 'distrato'
      );
      const totalVGV = teamSales.reduce((sum, s) => sum + Number(s.vgv || s.property_value || 0), 0);

      return {
        id: team.id,
        name: team.name,
        totalVGV,
        totalSales: teamSales.length,
        brokerCount: teamBrokers.length,
        position: 0,
      };
    })
    .filter(t => t.totalSales > 0 || t.brokerCount > 0)
    .sort((a, b) => b.totalVGV - a.totalVGV)
    .map((t, i) => ({ ...t, position: i + 1 }));
  }, [teams, brokers, filteredSales, isDiretor, isAdmin]);

  // Spotlight broker data - can be ANY broker, not just ranked ones
  const allBrokersForSpotlight = useMemo(() => {
    return brokers.map(b => ({ id: b.id, name: b.name }));
  }, [brokers]);

  const spotlightBroker = useMemo(() => {
    if (!spotlightBrokerId) return null;
    // First check ranked brokers for full data
    const ranked = brokerRankings.find(b => b.id === spotlightBrokerId);
    if (ranked) return ranked;
    // Fallback: broker exists but has no sales/ranking
    const broker = brokers.find(b => b.id === spotlightBrokerId);
    if (!broker) return null;
    return {
      id: broker.id,
      name: broker.name,
      avatar: broker.avatar_url || '',
      sales: 0,
      revenue: 0,
      position: 0,
    };
  }, [spotlightBrokerId, brokerRankings, brokers]);

  const openTVMode = () => {
    setIsTVMode(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const closeTVMode = () => {
    setIsTVMode(false);
    stopCustomSound();
    document.exitFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isTVMode) setIsTVMode(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isTVMode]);

  const handleQuickPeriod = (period: string) => {
    setQuickPeriod(period);
    if (period !== 'month') {
      setSelectedMonth(0);
      setSelectedYear(0);
    }
  };

  if (brokersLoading || salesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
          <RankingSkeleton />
        </div>
      </div>
    );
  }

  if (isTVMode) {
    return <RankingTVMode brokerRankings={brokerRankings} captacaoRankings={captacaoRankings} onClose={closeTVMode} sales={sales} tvRankingMode={tvRankingMode} />;
  }

  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ConfettiCanvas active={showConfetti} />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-24 lg:pb-6">
        {/* Header with role-based title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            {effectiveLogo ? (
              <img src={effectiveLogo} alt={headerInfo.title} className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-xl lg:text-2xl font-black text-foreground flex items-center gap-2">
                {headerInfo.title}
                <Sparkles className="w-5 h-5 text-warning" />
              </h1>
              <p className="text-xs text-muted-foreground">{headerInfo.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Ranking Type Selector */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <Button
                variant={rankingType === 'vendas' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setRankingType('vendas')}
                className="text-xs h-7 px-3 rounded-md"
              >
                Vendas
              </Button>
              <Button
                variant={rankingType === 'captacao' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setRankingType('captacao')}
                className="text-xs h-7 px-3 rounded-md"
              >
                Captação
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-9 w-9"
              title={soundEnabled ? "Desativar sons" : "Ativar sons"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </Button>
            {/* TV Mode with config */}
            <div className="flex items-center gap-1">
              <Select value={tvRankingMode} onValueChange={(v) => setTVRankingMode(v as TVRankingMode)}>
                <SelectTrigger className="h-9 w-[140px] text-xs border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alternate">Alternar rankings</SelectItem>
                  <SelectItem value="vendas">Só Vendas</SelectItem>
                  <SelectItem value="captacao">Só Captação</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openTVMode} className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg text-sm h-9">
                <Tv className="w-4 h-4" />
                Modo TV
              </Button>
            </div>
          </div>
        </div>

        {/* Quick period */}
        <QuickPeriodButtons activePeriod={quickPeriod} onPeriodChange={handleQuickPeriod} />

        {/* Custom period filter */}
        {quickPeriod === 'month' && (
          <PeriodFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        )}

        {/* Team filter */}
        {teamsForFilter.length > 0 && (
          <TeamFilter
            teams={teamsForFilter}
            selectedTeam={selectedTeam}
            onTeamChange={setSelectedTeam}
          />
        )}

        {/* Stats */}
        <StatsHeader brokers={rankingType === 'captacao' ? captacaoRankings : brokerRankings} />

        {/* Main content: Ranking + Spotlight sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Main ranking */}
          <div className="flex-1 min-w-0">
            {/* Team ranking for directors (only in vendas mode) */}
            {rankingType === 'vendas' && (isDiretor() || isAdmin()) && teamRankings.length > 0 && selectedTeam === 'all' && (
              <TeamRankingSection teamRankings={teamRankings} />
            )}

            {/* Podium */}
            {(rankingType === 'captacao' ? captacaoRankings : brokerRankings).length >= 1 && (
              <Card className="p-4 md:p-6 mb-6 border-border/30 overflow-hidden relative bg-gradient-to-br from-card via-card to-primary/[0.03]">
                <AnimatedPodium brokers={rankingType === 'captacao' ? captacaoRankings : brokerRankings} currentUserId={user?.id} />
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="overflow-hidden border-border/50">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <Flame className="w-5 h-5 text-warning" />
                <h2 className="font-semibold text-foreground text-sm">
                  {rankingType === 'captacao' ? 'Classificação Captadores' : 'Classificação Completa'}
                </h2>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {(rankingType === 'captacao' ? captacaoRankings : brokerRankings).length} {rankingType === 'captacao' ? 'captadores' : 'corretores'}
                </Badge>
              </div>
              <div className="p-3 space-y-2">
                {(rankingType === 'captacao' ? captacaoRankings : brokerRankings).map((broker) => (
                  <LeaderboardCard
                    key={broker.id}
                    broker={broker}
                    allBrokers={rankingType === 'captacao' ? captacaoRankings : brokerRankings}
                    currentUserId={user?.id}
                    showProgressBar={broker.position > 1}
                  />
                ))}
                {(rankingType === 'captacao' ? captacaoRankings : brokerRankings).length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                      {rankingType === 'captacao' ? 'Nenhuma captação encontrada no período' : 'Nenhum corretor encontrado no período'}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Tente alterar o filtro de período</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: Spotlight sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <SpotlightBrokerSidebar
              broker={spotlightBroker}
              allBrokers={brokerRankings}
              canManage={canManageSpotlight}
              availableBrokers={allBrokersForSpotlight}
              onChangeBroker={setSpotlightBroker}
              isUpdating={spotlightUpdating}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.5; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .shimmer-effect {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Ranking;
