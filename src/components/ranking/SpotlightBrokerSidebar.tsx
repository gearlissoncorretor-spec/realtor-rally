import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Star, Trophy, Crown } from "lucide-react";
import { BrokerRanking, getAchievements, calculateXP, getLevel } from "./types";

interface SpotlightBrokerSidebarProps {
  broker: { id: string; name: string; avatar?: string; sales?: number; revenue?: number; position?: number } | null;
  allBrokers: BrokerRanking[];
  canManage: boolean;
  availableBrokers: { id: string; name: string }[];
  onChangeBroker: (brokerId: string | null) => void;
  isUpdating: boolean;
}

const SpotlightBrokerSidebar = ({ broker, allBrokers, canManage, availableBrokers, onChangeBroker, isUpdating }: SpotlightBrokerSidebarProps) => {
  if (!broker && !canManage) return null;

  const brokerRankingData = broker ? allBrokers.find(b => b.id === broker.id) : null;
  const achievements = brokerRankingData ? getAchievements(brokerRankingData, allBrokers) : [];
  const xp = brokerRankingData ? calculateXP(brokerRankingData) : 0;
  const level = brokerRankingData ? getLevel(xp) : null;
  const initials = broker?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '';

  return (
    <Card className="relative overflow-hidden border-warning/20 animate-glow-champion">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--warning) / 0.2) 0%, hsl(var(--primary) / 0.15) 50%, hsl(var(--warning) / 0.2) 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 6s ease-in-out infinite',
          }}
        />
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-warning/15 blur-2xl animate-pulse" />
        <div className="absolute bottom-8 left-4 w-14 h-14 rounded-full bg-primary/12 blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-warning/8 blur-3xl animate-spotlight-pulse" />
      </div>

      <div className="relative z-10 p-5">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-warning animate-medal-pulse" />
          <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Corretor Destaque</h3>
          <Star className="w-3 h-3 text-warning animate-medal-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {broker ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute -inset-3 rounded-full bg-warning/25 blur-xl animate-spotlight-pulse" />
              <div className="absolute -inset-1 rounded-full animate-[spin_8s_linear_infinite] opacity-70" style={{
                background: 'conic-gradient(from 0deg, rgba(250,204,21,0.6), rgba(245,158,11,0.3), rgba(250,204,21,0.1), rgba(250,204,21,0.6))',
                borderRadius: '50%',
              }} />
              <Avatar className="w-24 h-24 ring-4 ring-warning/60 shadow-2xl relative z-10 transition-transform hover:scale-105">
                <AvatarImage src={broker.avatar} alt={broker.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-700 text-yellow-100 text-2xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 z-20">
                <Crown className="w-7 h-7 text-warning animate-medal-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
              </div>
            </div>

            <p className="font-black text-foreground text-xl mb-1 tracking-tight">{broker.name}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-warning" />
              <span className="text-xs font-bold text-warning uppercase tracking-wider">Destaque do Mês</span>
              <Trophy className="w-4 h-4 text-warning" />
            </div>

            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-warning/50"
                  style={{
                    left: `${10 + i * 12}%`,
                    top: `${15 + (i % 4) * 18}%`,
                    animation: `float-particle ${2.5 + i * 0.4}s ease-in-out infinite`,
                    animationDelay: `${i * 0.25}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Nenhum corretor selecionado</p>
          </div>
        )}

        {canManage && (
          <div className="mt-4 pt-3 border-t border-warning/10">
            <label className="text-[10px] text-muted-foreground block mb-1.5">Selecionar destaque:</label>
            <Select
              value={broker?.id || 'none'}
              onValueChange={(v) => onChangeBroker(v === 'none' ? null : v)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 text-xs border-warning/20 hover:border-warning/40 transition-colors">
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

export default SpotlightBrokerSidebar;
