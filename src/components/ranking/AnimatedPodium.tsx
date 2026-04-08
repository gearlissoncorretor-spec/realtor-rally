import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact } from "@/utils/formatting";
import { BrokerRanking, getAchievements, calculateXP, getLevel, getXPProgress } from "./types";
import ParticleEffect from "./ParticleEffect";

const AnimatedPodium = ({ brokers, currentUserId }: { brokers: BrokerRanking[]; currentUserId?: string }) => {
  const top3 = brokers.slice(0, 3);
  const podiumOrder = [
    top3.find(b => b.position === 2),
    top3.find(b => b.position === 1),
    top3.find(b => b.position === 3),
  ].filter(Boolean) as BrokerRanking[];

  if (podiumOrder.length === 0) return null;

  const podiumConfig = [
    { height: "h-32 md:h-40", avatarSize: "w-14 h-14 md:w-16 md:h-16", nameSize: "text-sm md:text-base", valueSize: "text-lg md:text-xl", ring: "ring-slate-300/60", gradient: "from-[#0B3C8C]/30 via-[#0B3C8C]/15 to-transparent", border: "border-[#0F4ED8]/40", numColor: "text-slate-300/70", numSize: "text-4xl md:text-5xl", glowColor: "rgba(15,78,216,0.35)", pedestalBg: "linear-gradient(180deg, #0F4ED8 0%, #0B3C8C 100%)" },
    { height: "h-44 md:h-56", avatarSize: "w-18 h-18 md:w-22 md:h-22", nameSize: "text-base md:text-lg", valueSize: "text-xl md:text-2xl", ring: "ring-yellow-400/70", gradient: "from-[#0F4ED8]/30 via-[#0B3C8C]/15 to-transparent", border: "border-yellow-400/40", numColor: "text-yellow-400/60", numSize: "text-5xl md:text-6xl", glowColor: "rgba(250,204,21,0.4)", pedestalBg: "linear-gradient(180deg, #0F4ED8 0%, #0B3C8C 100%)" },
    { height: "h-24 md:h-32", avatarSize: "w-12 h-12 md:w-14 md:h-14", nameSize: "text-xs md:text-sm", valueSize: "text-base md:text-lg", ring: "ring-orange-400/50", gradient: "from-[#0B3C8C]/25 via-[#0B3C8C]/10 to-transparent", border: "border-[#0F4ED8]/35", numColor: "text-slate-300/60", numSize: "text-3xl md:text-4xl", glowColor: "rgba(15,78,216,0.3)", pedestalBg: "linear-gradient(180deg, #0F4ED8 0%, #0B3C8C 100%)" },
  ];

  return (
    <div className="relative mb-8">
      <ParticleEffect />
      <div className="flex items-end justify-center gap-4 md:gap-8 pt-8">
        {podiumOrder.map((broker, index) => {
          const config = podiumConfig[index];
          const isFirst = broker.position === 1;
          const isCurrentUser = broker.userId === currentUserId;
          const initials = broker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
          const xp = calculateXP(broker);
          const level = getLevel(xp);
          const xpProgress = getXPProgress(xp);
          const achievements = getAchievements(broker, brokers);

          return (
            <div
              key={broker.id}
              className="flex flex-col items-center animate-fade-in group"
              style={{ animationDelay: `${isFirst ? 0.4 : index === 0 ? 0.2 : 0.6}s` }}
            >
              {isFirst && (
                <div className="relative mb-1 animate-medal-pulse">
                  <Crown className="w-8 h-8 md:w-10 md:h-10 text-warning drop-shadow-[0_0_14px_rgba(250,204,21,0.7)]" />
                </div>
              )}

              <div className="relative mb-3">
                {isFirst && (
                  <div className="absolute -inset-5 rounded-full blur-2xl animate-spotlight-pulse" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 60%)` }} />
                )}
                <div className="absolute -inset-1.5 rounded-full animate-[spin_8s_linear_infinite] opacity-70" style={{
                  background: isFirst
                    ? 'conic-gradient(from 0deg, rgba(250,204,21,0.7), rgba(245,158,11,0.5), rgba(250,204,21,0.15), rgba(250,204,21,0.7))'
                    : broker.position === 2
                    ? 'conic-gradient(from 0deg, rgba(148,163,184,0.5), rgba(148,163,184,0.15), rgba(148,163,184,0.5))'
                    : 'conic-gradient(from 0deg, rgba(251,146,60,0.5), rgba(251,146,60,0.15), rgba(251,146,60,0.5))',
                  borderRadius: '50%',
                }} />
                <Avatar className={cn(
                  isFirst ? "w-16 h-16 md:w-20 md:h-20" : config.avatarSize,
                  "ring-4 shadow-2xl transition-all duration-300 relative z-10 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.2)]",
                  config.ring,
                  isCurrentUser && "ring-primary ring-offset-2 ring-offset-background"
                )}>
                  <AvatarImage src={broker.avatar} alt={broker.name} className="object-cover" />
                  <AvatarFallback className={cn(
                    "font-black",
                    isFirst ? "bg-gradient-to-br from-yellow-500 to-amber-700 text-yellow-100 text-xl md:text-2xl" :
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

              <p className={cn("font-bold text-center leading-tight text-foreground mb-0.5", config.nameSize)}>
                {broker.name.split(' ').slice(0, 2).join(' ')}
              </p>
              <p className="text-[11px] text-muted-foreground mb-0.5">{broker.sales} {broker.sales === 1 ? 'venda' : 'vendas'}</p>

              {achievements.length > 0 && (
                <div className="flex gap-0.5 mb-1">
                  {achievements.slice(0, 2).map((badge, i) => (
                    <span key={i} className="text-sm" title={badge.label}>{badge.icon}</span>
                  ))}
                </div>
              )}

              <p className={cn(
                "font-black mb-2 animate-number-count tracking-tight",
                config.valueSize,
                isFirst ? "text-warning drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]" : "text-foreground"
              )}>
                {formatCurrencyCompact(broker.revenue)}
              </p>

              <div className={cn(
                "w-26 md:w-36 rounded-2xl border flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-[1.03] glass-pedestal pedestal-reflection",
                config.height,
                config.border
              )} style={{
                boxShadow: isFirst
                  ? `0 12px 40px -4px ${config.glowColor}, 0 0 25px rgba(255,200,0,0.3), 0 20px 40px rgba(15,78,216,0.35)`
                  : `0 12px 40px -4px ${config.glowColor}, 0 20px 40px rgba(15,78,216,0.35)`,
                background: config.pedestalBg,
              }}>
                {isFirst && (
                  <div className="absolute inset-0 shimmer-effect" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-transparent rounded-2xl" />
                <span className={cn("font-black relative z-10 animate-number-count", config.numColor, config.numSize)} style={{ animationDelay: '0.3s' }}>
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

export default AnimatedPodium;
