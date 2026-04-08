import { useState, useEffect, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Crown, X, Volume2, VolumeX, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCurrencyCompact } from "@/utils/formatting";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { BrokerRanking, RankingType, TVRankingMode, calculateXP, getLevel } from "./types";
import { ConfettiCanvas, useRankingSounds } from "./RankingEffects";

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
    { label: "Vendas", value: totalSales.toString(), color: "from-blue-400 to-blue-600" },
    { label: "VGV Total", value: formatCurrencyCompact(totalVGV), color: "from-emerald-400 to-emerald-600" },
    { label: "Ticket Médio", value: formatCurrencyCompact(avgTicket), color: "from-cyan-400 to-cyan-600" },
    { label: "Líder", value: topBroker?.name.split(' ')[0] || '-', color: "from-yellow-400 to-amber-500" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="relative overflow-hidden rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] p-3">
          <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r", stat.color)} />
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="text-xl font-black text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

// ===== RECENT SALES TICKER =====
const RecentSalesTicker = ({ sales, brokers }: { sales: any[]; brokers: BrokerRanking[] }) => {
  const recentSales = useMemo(() => {
    return sales
      .filter(s => s.status !== 'cancelada' && s.status !== 'distrato')
      .sort((a: any, b: any) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 10)
      .map((s: any) => {
        const broker = brokers.find(b => b.id === s.broker_id);
        return {
          id: s.id,
          brokerName: broker?.name || s.vendedor || 'Corretor',
          clientName: s.client_name,
          value: Number(s.vgv || s.property_value || 0),
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div className="relative z-10 text-center animate-scale-in max-w-lg mx-auto px-6">
        <div className="absolute inset-0 -m-20 rounded-full bg-yellow-400/10 blur-[80px] animate-pulse" />
        <div className="mb-4 relative inline-block">
          <div className="absolute -inset-4 rounded-full bg-yellow-400/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/40">
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">🎉 NOVA VENDA! 🎉</h2>
        {broker && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <Avatar className="w-14 h-14 ring-4 ring-yellow-400/50 shadow-xl">
              <AvatarImage src={broker.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100 text-lg font-black">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-xl font-bold text-white">{broker.name}</p>
              <p className="text-sm text-yellow-300/70">#{broker.position} no ranking</p>
            </div>
          </div>
        )}
        <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/[0.1] p-5 mb-4">
          <p className="text-sm text-blue-200/60 mb-1">Cliente</p>
          <p className="text-lg font-semibold text-white mb-3">{sale.clientName}</p>
          <p className="text-sm text-blue-200/60 mb-1">Valor da Venda</p>
          <p className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">{formatCurrency(sale.value)}</p>
        </div>
        <p className="text-lg text-white/60 font-medium">Parabéns! Você é imparável! 🔥</p>
      </div>
    </div>
  );
};

// ===== TV MODE MAIN =====
interface RankingTVModeProps {
  brokerRankings: BrokerRanking[];
  captacaoRankings: BrokerRanking[];
  allBrokerRankings?: BrokerRanking[];
  onClose: () => void;
  sales: any[];
  tvRankingMode: TVRankingMode;
  periodLabel: string;
  spotlightBroker: { id: string; name: string; avatar?: string; sales?: number; revenue?: number; position?: number } | null;
  slideInterval?: number;
}

const RankingTVMode = ({ brokerRankings, captacaoRankings, allBrokerRankings, onClose, sales, tvRankingMode: initialTvRankingMode, periodLabel, spotlightBroker, slideInterval = 20 }: RankingTVModeProps) => {
  const { settings } = useOrganizationSettings();
  const { playVictory, playReveal, playCelebration, soundEnabled, setSoundEnabled, stopCustomSound } = useRankingSounds();
  const [revealedCount, setRevealedCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'reveal' | 'complete'>('intro');
  const [viewMode, setViewMode] = useState<'full' | 'podium'>('full');
  const [celebratingSale, setCelebratingSale] = useState<{ clientName: string; value: number; brokerId: string | null } | null>(null);
  const [tvRankingMode, setTvRankingMode] = useState<TVRankingMode>(initialTvRankingMode);
  const [activeRankingType, setActiveRankingType] = useState<RankingType>(initialTvRankingMode === 'captacao' ? 'captacao' : 'vendas');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showRankingMenu, setShowRankingMenu] = useState(false);
  const lastSaleCountRef = useRef(sales.length);

  const currentRankings = activeRankingType === 'captacao' ? captacaoRankings : brokerRankings;
  const top3 = currentRankings.slice(0, 3);
  const rest = viewMode === 'full' ? currentRankings.slice(3, 10) : [];
  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;
  const orgName = settings?.organization_name || 'Ranking';

  // Auto-alternate rankings
  useEffect(() => {
    if (tvRankingMode !== 'alternate') return;
    const ms = (slideInterval || 20) * 1000;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveRankingType(prev => prev === 'vendas' ? 'captacao' : 'vendas');
        setPhase('intro');
        setRevealedCount(0);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 500);
    }, ms);
    return () => clearInterval(interval);
  }, [tvRankingMode, slideInterval]);

  // Detect new sales
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

      {celebratingSale && (
        <SaleCelebrationOverlay
          sale={celebratingSale}
          broker={celebratingBroker}
          onDismiss={() => setCelebratingSale(null)}
        />
      )}

      {/* Animated BG */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #050b1f 0%, #0c1445 20%, #1a0a3e 40%, #0d1f5c 60%, #061233 80%, #030712 100%)',
        }} />
        <div className="absolute inset-0 opacity-40" style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(124,58,237,0.3) 25%, rgba(99,102,241,0.25) 50%, rgba(251,191,36,0.15) 75%, rgba(6,182,212,0.2) 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease-in-out infinite',
        }} />
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full blur-[180px]" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)', animation: 'orb-float 14s ease-in-out infinite' }} />
        <div className="absolute top-[10%] right-[-10%] w-[750px] h-[750px] rounded-full blur-[170px]" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', animation: 'orb-float 12s ease-in-out infinite', animationDelay: '3s' }} />
        <div className="absolute bottom-[-15%] left-[20%] w-[700px] h-[700px] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', animation: 'orb-float 16s ease-in-out infinite', animationDelay: '6s' }} />
        <div className="absolute bottom-[-5%] right-[5%] w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)', animation: 'orb-float 11s ease-in-out infinite', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-[500px] h-[500px] rounded-full blur-[140px] -translate-x-1/2" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', animation: 'orb-float 13s ease-in-out infinite', animationDelay: '5s' }} />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[350px] h-[350px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)', animation: 'orb-float 8s ease-in-out infinite' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
        {Array.from({ length: 30 }).map((_, i) => {
          const colors = ['bg-blue-400/40', 'bg-blue-300/35', 'bg-indigo-400/35', 'bg-purple-400/40', 'bg-violet-400/35', 'bg-amber-400/45', 'bg-yellow-300/40', 'bg-cyan-400/35', 'bg-sky-300/30', 'bg-fuchsia-400/25'];
          const sizes = ['w-2 h-2', 'w-1.5 h-1.5', 'w-1 h-1', 'w-0.5 h-0.5', 'w-[3px] h-[3px]'];
          return (
            <div key={i} className={cn("absolute rounded-full", colors[i % colors.length], sizes[i % sizes.length])} style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              animation: `float-particle ${5 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 8}s`,
            }} />
          );
        })}
      </div>

      {/* Top bar */}
      <div className="relative z-50 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowRankingMenu(!showRankingMenu)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-8 px-2.5 gap-1.5">
              <Settings className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Exibição</span>
            </Button>
            {showRankingMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white/[0.1] backdrop-blur-xl rounded-xl border border-white/[0.12] p-1.5 min-w-[180px] shadow-2xl z-[100]">
                {[
                  { value: 'vendas' as TVRankingMode, label: 'Vendas', icon: '💰', desc: 'Ranking por VGV' },
                  { value: 'captacao' as TVRankingMode, label: 'Captação', icon: '🏠', desc: 'Ranking por captação' },
                  { value: 'alternate' as TVRankingMode, label: 'Alternar', icon: '🔄', desc: 'Alterna automaticamente' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTvRankingMode(opt.value);
                      if (opt.value !== 'alternate') {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          setActiveRankingType(opt.value === 'captacao' ? 'captacao' : 'vendas');
                          setPhase('intro');
                          setRevealedCount(0);
                          setTimeout(() => setIsTransitioning(false), 300);
                        }, 300);
                      }
                      setShowRankingMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                      tvRankingMode === opt.value ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    <span className="text-sm">{opt.icon}</span>
                    <div>
                      <p className="text-xs font-medium">{opt.label}</p>
                      <p className="text-[10px] text-white/40">{opt.desc}</p>
                    </div>
                    {tvRankingMode === opt.value && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/[0.08]">
            <div className={cn("w-2 h-2 rounded-full transition-colors duration-500", activeRankingType === 'vendas' ? "bg-blue-400" : "bg-emerald-400")} />
            <span className="text-xs text-white/60 font-medium">{activeRankingType === 'vendas' ? 'Vendas' : 'Captação'}</span>
            {tvRankingMode === 'alternate' && <span className="text-[10px] text-white/25 ml-1">auto</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock />
          <div className="flex items-center bg-white/[0.08] backdrop-blur-sm rounded-xl p-0.5 border border-white/[0.1]">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('full')} className={cn("text-xs h-7 px-3 rounded-lg", viewMode === 'full' ? "bg-white/15 text-white shadow-inner" : "text-white/40 hover:text-white")}>Completo</Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('podium')} className={cn("text-xs h-7 px-3 rounded-lg", viewMode === 'podium' ? "bg-white/15 text-white shadow-inner" : "text-white/40 hover:text-white")}>Pódio</Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn("relative z-10 flex-1 flex flex-col px-6 lg:px-10 pb-0 transition-all duration-500", isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100')}>
        {/* Header */}
        <div className={cn("text-center mb-4 transition-all duration-1000", phase === 'intro' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0')}>
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
              <p className="text-lg font-bold text-amber-300/90 tracking-wide">{periodLabel}</p>
              <p className="text-xs text-cyan-300/50 font-medium tracking-[0.3em] uppercase">{orgName}</p>
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

        {phase === 'complete' && (
          <div className="animate-fade-in">
            <TVStatsBar brokers={activeRankingType === 'captacao' ? captacaoRankings : (allBrokerRankings || brokerRankings)} />
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

              return (
                <div key={broker.id} className={cn("flex flex-col items-center transition-all duration-700", revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')} style={{ transitionDelay: revealed ? `${index * 200}ms` : '0ms' }}>
                  {isFirst && revealed && (
                    <div className="mb-2 animate-bounce" style={{ animationDuration: '2s' }}>
                      <Crown className={cn("text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.7)]", viewMode === 'podium' ? "w-14 h-14" : "w-10 h-10")} />
                    </div>
                  )}
                  <div className="relative mb-3">
                    {isFirst && revealed && (
                      <div className="absolute -inset-4 rounded-full blur-2xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0) 70%)' }} />
                    )}
                    <Avatar className={cn(avatarSizes[index], "ring-4 shadow-2xl relative z-10", ringColors[index])}>
                      <AvatarImage src={broker.avatar} alt={broker.name} className="object-cover" />
                      <AvatarFallback className={cn("font-black",
                        isFirst ? "bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100 text-xl md:text-2xl" :
                        broker.position === 2 ? "bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100 text-lg" :
                        "bg-gradient-to-br from-orange-600 to-orange-800 text-orange-100 text-sm"
                      )}>{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <p className={cn("font-bold text-center leading-tight text-white", viewMode === 'podium' ? "text-base lg:text-lg" : "text-sm lg:text-base")}>
                    {broker.name.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <p className="text-xs text-blue-200/60 mb-0.5">{broker.sales} {broker.sales === 1 ? 'venda' : 'vendas'}</p>
                  <p className={cn("font-black mb-2", viewMode === 'podium' ? "text-lg lg:text-xl" : "text-base lg:text-lg", isFirst ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "text-white")}>
                    {formatCurrencyCompact(broker.revenue)}
                  </p>
                  <div className={cn("w-24 md:w-32 rounded-t-xl border-2 flex items-center justify-center relative overflow-hidden", podiumHeights[index], `bg-gradient-to-t ${podiumGradients[index]}`)}>
                    {isFirst && <div className="absolute inset-0 shimmer-effect" />}
                    <div className={cn("absolute bottom-0 left-0 right-0 h-1/2 blur-2xl", isFirst ? "bg-yellow-500/15" : broker.position === 2 ? "bg-slate-400/10" : "bg-orange-500/10")} />
                    <span className={cn("font-black relative z-10", isFirst ? "text-7xl text-yellow-400/50" : "text-5xl text-white/15")}>{broker.position}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Podium-only compact list */}
          {viewMode === 'podium' && currentRankings.length > 3 && phase === 'complete' && (
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto mt-4 animate-fade-in">
              {currentRankings.slice(3).map((broker, i) => {
                const chipColors = ['from-blue-500/10 to-blue-500/5 border-blue-400/20', 'from-purple-500/10 to-purple-500/5 border-purple-400/20', 'from-emerald-500/10 to-emerald-500/5 border-emerald-400/20', 'from-pink-500/10 to-pink-500/5 border-pink-400/20', 'from-cyan-500/10 to-cyan-500/5 border-cyan-400/20'];
                return (
                  <div key={broker.id} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r border backdrop-blur-sm", chipColors[i % chipColors.length])}>
                    <span className="text-sm font-black text-white/35">#{broker.position}</span>
                    <Avatar className="h-8 w-8 ring-1 ring-white/10">
                      <AvatarImage src={broker.avatar} />
                      <AvatarFallback className="text-[10px] bg-slate-700 text-slate-200 font-bold">{broker.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/75 font-semibold">{broker.name.split(' ')[0]}</span>
                    <span className="text-xs text-blue-300/60 font-bold">{formatCurrencyCompact(broker.revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full mode detailed list */}
          {viewMode === 'full' && rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-w-5xl mx-auto w-full">
              {rest.map((broker, idx) => {
                const revealed = isRevealed(broker.position);
                const cardColors = ['hover:border-blue-400/30 hover:bg-blue-500/[0.06]', 'hover:border-purple-400/30 hover:bg-purple-500/[0.06]', 'hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]', 'hover:border-pink-400/30 hover:bg-pink-500/[0.06]', 'hover:border-cyan-400/30 hover:bg-cyan-500/[0.06]', 'hover:border-amber-400/30 hover:bg-amber-500/[0.06]', 'hover:border-rose-400/30 hover:bg-rose-500/[0.06]'];
                return (
                  <div key={broker.id} className={cn("flex items-center gap-3 p-3.5 rounded-xl backdrop-blur-sm border bg-white/[0.04] border-white/[0.08] transition-all duration-500", cardColors[idx % cardColors.length], revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4')} style={{ transitionDelay: `${idx * 100}ms` }}>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/[0.08] to-white/[0.03] flex items-center justify-center shrink-0 border border-white/[0.06]">
                      <span className="text-sm font-black text-white/45">#{broker.position}</span>
                    </div>
                    <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/10">
                      <AvatarImage src={broker.avatar} />
                      <AvatarFallback className="text-xs bg-slate-700 text-slate-200 font-bold">{broker.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
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

          {/* Spotlight in TV */}
          {spotlightBroker && phase === 'complete' && (
            <div className="max-w-5xl mx-auto w-full mt-4 animate-fade-in">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/[0.08] via-amber-500/[0.05] to-yellow-500/[0.08] border border-yellow-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-300/80 uppercase tracking-wider">Destaque do Mês</span>
                </div>
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-yellow-400/20 blur-md" />
                  <Avatar className="h-12 w-12 ring-2 ring-yellow-400/50 relative z-10">
                    <AvatarImage src={spotlightBroker.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-600 to-amber-800 text-yellow-100 text-sm font-black">
                      {spotlightBroker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-yellow-400 z-20" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-base">{spotlightBroker.name}</p>
                  <p className="text-xs text-yellow-300/60">Destaque do Mês ✨</p>
                </div>
                <Star className="w-5 h-5 text-yellow-400/50 shrink-0" />
              </div>
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
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default RankingTVMode;
