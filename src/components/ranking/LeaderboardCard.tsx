import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCurrencyCompact } from "@/utils/formatting";
import { BrokerRanking, getAchievements, calculateXP, getLevel, getXPProgress } from "./types";
import PositionBadge from "./PositionBadge";

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
  const xpProgress = getXPProgress(xp);
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
        : broker.position <= 3
        ? "bg-card/80 border-border/60 hover:border-primary/30 hover:shadow-md"
        : "bg-card/50 border-border/50 hover:border-primary/20 hover:bg-card/80"
    )}>
      <div className="flex items-center gap-3">
        <PositionBadge position={broker.position} />

        <Avatar className="h-10 w-10 ring-2 ring-border/50 group-hover:ring-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{broker.sales} {broker.sales === 1 ? 'venda' : 'vendas'}</span>
              {broker.teamName && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/60">{broker.teamName}</Badge>
              )}
              {broker.participationPct !== undefined && broker.participationPct > 0 && (
                <span className="text-[10px] text-primary font-medium">{broker.participationPct.toFixed(1)}% do VGV</span>
              )}
            </div>
          </div>

        <div className="text-right">
          <p className="font-black text-sm text-foreground tracking-tight">{formatCurrency(broker.revenue)}</p>
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
          {achievements.slice(0, 4).map((badge, i) => (
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

export default LeaderboardCard;
