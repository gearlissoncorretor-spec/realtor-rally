import Navigation from "@/components/Navigation";
import RankingPodium from "@/components/RankingPodium";
import { RankingSkeleton } from "@/components/skeletons/RankingSkeleton";
import PeriodFilter from "@/components/PeriodFilter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, TrendingDown, Tv, Sparkles, Flame, Medal, Star, X, Volume2, VolumeX } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/utils/formatting";
import { calculateGrowth } from "@/utils/calculations";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const Ranking = () => {
  const { brokers, sales, brokersLoading, salesLoading } = useData();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [isTVMode, setIsTVMode] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at || '');
      if (selectedYear > 0 && saleDate.getFullYear() !== selectedYear) return false;
      if (selectedMonth > 0 && saleDate.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });
  }, [sales, selectedMonth, selectedYear]);

  const brokerRankings = useMemo(() => {
    return brokers.map(broker => {
      const brokerSales = filteredSales.filter(sale => sale.broker_id === broker.id);
      const totalRevenue = brokerSales.reduce((sum, sale) => sum + Number(sale.property_value), 0);
      const salesCount = brokerSales.length;
      return {
        id: broker.id,
        name: broker.name,
        avatar: broker.avatar_url || '',
        sales: salesCount,
        revenue: totalRevenue,
        position: 0,
        growth: calculateGrowth(broker.id, sales),
        email: broker.email
      };
    })
    .filter(broker => broker.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map((broker, index) => ({ ...broker, position: index + 1 }));
  }, [brokers, filteredSales, sales]);

  const openTVMode = () => {
    setIsTVMode(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const closeTVMode = () => {
    setIsTVMode(false);
    document.exitFullscreen?.().catch(() => {});
  };

  // Listen for ESC to exit TV mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isTVMode) {
        setIsTVMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isTVMode]);

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
    return <RankingTVMode brokerRankings={brokerRankings} onClose={closeTVMode} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-warning" />
              Ranking de Corretores
            </h1>
            <p className="text-sm text-muted-foreground">Performance e classificação da equipe</p>
          </div>
          <Button onClick={openTVMode} className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg">
            <Tv className="w-4 h-4" />
            Modo TV
          </Button>
        </div>

        <PeriodFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <div className="mb-6">
          <RankingPodium brokers={brokerRankings.slice(0, 3)} />
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Flame className="w-5 h-5 text-warning" />
            <h2 className="font-semibold text-foreground">Classificação Completa</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Corretor</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Vendas</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Receita</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Crescimento</th>
                </tr>
              </thead>
              <tbody>
                {brokerRankings.map((broker) => (
                  <tr 
                    key={broker.id} 
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-muted/30",
                      broker.position === 1 && "bg-warning/5",
                      broker.position === 2 && "bg-muted/20",
                      broker.position === 3 && "bg-orange-500/5",
                    )}
                  >
                    <td className="py-3 px-4"><PositionBadge position={broker.position} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={broker.avatar} />
                          <AvatarFallback className="text-xs">{broker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{broker.name}</p>
                          <p className="text-xs text-muted-foreground">{broker.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-lg font-bold text-foreground">{broker.sales}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm">{formatCurrency(broker.revenue)}</p>
                    </td>
                    <td className="py-3 px-4">
                      {broker.growth !== null ? (
                        <div className="flex items-center gap-1">
                          {broker.growth > 0 ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <span className={cn("text-sm font-medium", broker.growth > 0 ? 'text-success' : 'text-destructive')}>
                            {broker.growth > 0 ? '+' : ''}{broker.growth.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {brokerRankings.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum corretor encontrado no período</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Position badge
const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
        <Trophy className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (position === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md">
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (position === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
      <span className="text-xs font-bold text-muted-foreground">{position}</span>
    </div>
  );
};

// ===== PREMIUM TV MODE =====

// Web Audio API sound effects
const useRankingSounds = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playFanfare = useCallback(() => {
    if (muted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    
    // Triumphant fanfare: C5 → E5 → G5 → C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.6);
    });
  }, [muted, getCtx]);

  const playReveal = useCallback(() => {
    if (muted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }, [muted, getCtx]);

  const playAmbient = useCallback(() => {
    if (muted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Soft pad chord C major
    [261.63, 329.63, 392.00].forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 1);
      gain.gain.linearRampToValueAtTime(0, now + 4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 4.5);
    });
  }, [muted, getCtx]);

  return { playFanfare, playReveal, playAmbient, muted, setMuted };
};

// Confetti particle system
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

    for (let i = 0; i < 150; i++) {
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
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.99;
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
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" />;
};

const RankingTVMode = ({ brokerRankings, onClose }: { brokerRankings: any[]; onClose: () => void }) => {
  const { settings } = useOrganizationSettings();
  const { playFanfare, playReveal, playAmbient, muted, setMuted } = useRankingSounds();
  const [revealedCount, setRevealedCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'reveal' | 'complete'>('intro');

  const top3 = brokerRankings.slice(0, 3);
  const rest = brokerRankings.slice(3, 10);

  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;
  const orgName = settings?.organization_name || 'Ranking';

  // Reveal animation sequence
  useEffect(() => {
    // Intro phase
    const introTimer = setTimeout(() => {
      playAmbient();
      setPhase('reveal');
    }, 1500);

    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'reveal') return;

    // Reveal rest first, then top 3 in reverse
    const totalToReveal = rest.length + top3.length;
    
    const revealNext = (i: number) => {
      if (i >= totalToReveal) {
        setPhase('complete');
        setShowConfetti(true);
        playFanfare();
        setTimeout(() => setShowConfetti(false), 5000);
        return;
      }
      
      setTimeout(() => {
        setRevealedCount(i + 1);
        if (i >= rest.length) {
          // Top 3 reveal
          playReveal();
        }
        revealNext(i + 1);
      }, i < rest.length ? 400 : 800);
    };

    revealNext(0);
  }, [phase]);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [
    top3.find(b => b.position === 2),
    top3.find(b => b.position === 1),
    top3.find(b => b.position === 3),
  ].filter(Boolean);

  const isRevealed = (position: number) => {
    if (phase === 'complete') return true;
    if (position > 3) {
      // Rest items: revealed in order
      const restIndex = position - 4;
      return restIndex < revealedCount;
    }
    // Top 3: revealed after rest, in reverse (3rd → 2nd → 1st)
    const top3Index = rest.length + (3 - position);
    return top3Index < revealedCount;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050a18] text-white overflow-hidden">
      <ConfettiCanvas active={showConfetti} />

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[150px]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Floating particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${6 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMuted(!muted)}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-6 lg:p-10">
        {/* Header with logo */}
        <div className={cn(
          "text-center mb-6 transition-all duration-1000",
          phase === 'intro' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        )}>
          <div className="flex items-center justify-center gap-4 mb-3">
            {effectiveLogo ? (
              <img src={effectiveLogo} alt={orgName} className="w-12 h-12 object-contain rounded-xl" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-xl font-black text-white">{orgName.charAt(0)}</span>
              </div>
            )}
            <div className="text-left">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                RANKING DE VENDAS
              </h1>
              <p className="text-sm text-blue-300/50 font-medium tracking-widest uppercase">{orgName} • Performance em tempo real</p>
            </div>
          </div>
          <div className="h-[1px] max-w-2xl mx-auto bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full">
          {/* PODIUM */}
          <div className="flex items-end justify-center gap-4 lg:gap-8 mb-8">
            {podiumOrder.map((broker: any, index) => {
              const isFirst = broker.position === 1;
              const revealed = isRevealed(broker.position);
              const podiumHeights = ['h-36 lg:h-44', 'h-48 lg:h-56', 'h-28 lg:h-36'];
              const avatarSizes = ['w-20 h-20 lg:w-24 lg:h-24', 'w-24 h-24 lg:w-32 lg:h-32', 'w-16 h-16 lg:w-20 lg:h-20'];
              
              return (
                <div 
                  key={broker.id} 
                  className={cn(
                    "flex flex-col items-center transition-all duration-700",
                    revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  )}
                  style={{ transitionDelay: revealed ? `${index * 200}ms` : '0ms' }}
                >
                  {/* Crown for 1st */}
                  {isFirst && revealed && (
                    <div className="mb-2 animate-bounce text-4xl" style={{ animationDuration: '2s' }}>👑</div>
                  )}
                  
                  {/* Avatar */}
                  <div className="relative mb-3">
                    <Avatar className={cn(
                      avatarSizes[index],
                      "ring-4 shadow-2xl transition-all duration-500",
                      isFirst ? "ring-yellow-400/70 shadow-yellow-500/40" : 
                      broker.position === 2 ? "ring-slate-300/50 shadow-slate-400/20" : "ring-orange-400/50 shadow-orange-500/20"
                    )}>
                      <AvatarImage src={broker.avatar} alt={broker.name} />
                      <AvatarFallback className={cn(
                        "text-xl lg:text-2xl font-black",
                        isFirst ? "bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100" :
                        broker.position === 2 ? "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100" :
                        "bg-gradient-to-br from-orange-600 to-orange-800 text-orange-100"
                      )}>
                        {broker.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {/* Glow effect for 1st */}
                    {isFirst && revealed && (
                      <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl animate-pulse" />
                    )}
                  </div>
                  
                  {/* Name & Stats */}
                  <p className={cn(
                    "font-bold text-center mb-0.5 leading-tight",
                    isFirst ? "text-lg lg:text-xl text-white" : "text-sm lg:text-base text-white/80"
                  )}>
                    {broker.name.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <p className="text-xs lg:text-sm text-blue-300/70 mb-1">{broker.sales} vendas</p>
                  <p className={cn(
                    "font-black mb-3",
                    isFirst ? "text-xl lg:text-2xl text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" : 
                    "text-base lg:text-lg text-blue-200"
                  )}>
                    {formatCurrency(broker.revenue)}
                  </p>
                  
                  {/* Podium base */}
                  <div className={cn(
                    "w-28 lg:w-36 rounded-t-2xl flex items-center justify-center relative overflow-hidden",
                    podiumHeights[index],
                    isFirst ? "bg-gradient-to-t from-yellow-500/20 via-yellow-500/10 to-transparent border-2 border-yellow-400/30" :
                    broker.position === 2 ? "bg-gradient-to-t from-slate-400/15 via-slate-400/5 to-transparent border-2 border-slate-400/25" :
                    "bg-gradient-to-t from-orange-500/15 via-orange-500/5 to-transparent border-2 border-orange-400/25"
                  )}>
                    {/* Shimmer effect */}
                    {isFirst && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-shimmer" />
                    )}
                    <span className={cn(
                      "font-black relative z-10",
                      isFirst ? "text-6xl lg:text-7xl text-yellow-400/60" : "text-4xl lg:text-5xl text-white/20"
                    )}>
                      {broker.position}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest of ranking - horizontal cards */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3 max-w-5xl mx-auto w-full">
              {rest.map((broker: any, idx) => {
                const revealed = isRevealed(broker.position);
                return (
                  <div
                    key={broker.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm border transition-all duration-500",
                      "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08]",
                      revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    )}
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-white/40">#{broker.position}</span>
                    </div>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={broker.avatar} />
                      <AvatarFallback className="text-xs bg-slate-700 text-slate-200 font-bold">
                        {broker.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{broker.name}</p>
                      <p className="text-xs text-blue-300/50">{broker.sales} vendas</p>
                    </div>
                    <p className="font-bold text-sm text-blue-200 whitespace-nowrap">{formatCurrency(broker.revenue)}</p>
                  </div>
                );
              })}
            </div>
          )}

          {brokerRankings.length === 0 && (
            <div className="text-center py-20">
              <Star className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-lg">Nenhum dado para exibir</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-white/15 text-xs tracking-widest uppercase">Pressione ESC para sair</p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Ranking;
