import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useData } from "@/contexts/DataContext";
import { useLeads } from "@/hooks/useLeads";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatting";
import { Trophy, Flame, Phone, Handshake, DollarSign, TrendingUp, Target, Pencil, Check, X, Sparkles, Medal, Volume2, VolumeX, Crown, Zap, Monitor, Maximize2, MoveRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseLocalDate } from "@/utils/dateParsing";
import { cn } from "@/lib/utils";
import { ConfettiCanvas, useRankingSounds } from "@/components/ranking/RankingEffects";
import { CountUp } from "@/components/gaming/CountUp";

const DISPLAY = "'Sora', 'Inter', system-ui, sans-serif";
const ANGULAR_CLIP = "polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px)";
const CORPORATE_BLUE = "#2563EB";
const SUCCESS_GREEN = "#10B981";

const GOLD = "#FFD700";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

const POINTS = {
  lead: 5,
  atendimento: 10,
  followup: 15,
  negociacao: 30,
  visita: 40,
  proposta: 50,
  venda: 200,
  captacao: 100,
  metaMensal: 300,
};

const LEVELS = [
  { name: "Iniciante", min: 0, max: 500 },
  { name: "Bronze", min: 501, max: 1500 },
  { name: "Prata", min: 1501, max: 3000 },
  { name: "Ouro", min: 3001, max: 6000 },
  { name: "Diamante", min: 6001, max: 10000 },
  { name: "Lenda Master", min: 10001, max: Infinity },
];

const getLevel = (pts: number) => LEVELS.find(l => pts >= l.min && pts <= l.max) ?? LEVELS[0];
const getNextLevel = (pts: number) => {
  const idx = LEVELS.findIndex(l => pts >= l.min && pts <= l.max);
  return LEVELS[idx + 1] ?? null;
};

interface Stats {
  brokerId: string;
  userId: string | null;
  name: string;
  avatar?: string | null;
  leads: number;
  atendimentos: number;
  followups: number;
  negociacoes: number;
  vendas: number;
  captacoes: number;
  vgv: number;
  conversao: number;
  points: number;
  ipm: number;
}

const Gaming = () => {
  const { brokers, sales } = useData();
  const { leads } = useLeads();
  const { negotiations } = useNegotiations();
  const { settings, updateSettings, getEffectiveLogo } = useOrganizationSettings();
  const { getUserRole, profile } = useAuth();
  const role = getUserRole?.() ?? "";
  const canEdit = ["diretor", "socio", "admin", "super_admin"].includes(role);
  const myAgencyId = (profile as any)?.agency_id ?? null;
  const restrictToAgency = role === "gerente" || role === "corretor";
  const logo = getEffectiveLogo();

  const [editing, setEditing] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tv') === 'true') {
      setTvMode(true);
    }
    setNameDraft((settings as any)?.gaming_name || "LIGA DOS CAMPEÕES");
  }, [settings]);

  const screenName = (settings as any)?.gaming_name || "LIGA DOS CAMPEÕES";

  const { playReveal, soundEnabled, setSoundEnabled } = useRankingSounds();
  const [confetti, setConfetti] = useState(false);
  const triggerCelebration = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3500);
  };

  // TV Mode Auto-cycle
  const [tvTab, setTvTab] = useState("all");
  useEffect(() => {
    if (!tvMode) return;
    const interval = setInterval(() => {
      setTvTab(prev => prev === "all" ? "ipm" : "all");
    }, 15000); // Cycle every 15s
    return () => clearInterval(interval);
  }, [tvMode]);

  const now = new Date();
  const hasSalesThisMonth = useMemo(
    () => sales.some((s: any) => {
      const d = parseLocalDate(s.sale_date);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }),
    [sales]
  );
  const defaultDate = hasSalesThisMonth ? now : new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [month, setMonth] = useState<string>(String(defaultDate.getMonth() + 1));
  const [year, setYear] = useState<string>(String(defaultDate.getFullYear()));
  const [autoDefaulted, setAutoDefaulted] = useState(false);
  useEffect(() => {
    if (!autoDefaulted && sales.length > 0) {
      setMonth(String(defaultDate.getMonth() + 1));
      setYear(String(defaultDate.getFullYear()));
      setAutoDefaulted(true);
    }
  }, [sales, hasSalesThisMonth]);

  const inPeriod = (dateStr?: string | null) => {
    if (month === "all") return true;
    if (!dateStr) return false;
    const d = parseLocalDate(dateStr);
    if (!d) return false;
    return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
  };

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(now.getFullYear());
    sales.forEach((s: any) => { const d = parseLocalDate(s.sale_date); if (d) set.add(d.getFullYear()); });
    return Array.from(set).sort((a, b) => b - a);
  }, [sales]);

  const months = [
    { v: "all", l: "Todos" }, { v: "1", l: "Janeiro" }, { v: "2", l: "Fevereiro" }, { v: "3", l: "Março" },
    { v: "4", l: "Abril" }, { v: "5", l: "Maio" }, { v: "6", l: "Junho" }, { v: "7", l: "Julho" },
    { v: "8", l: "Agosto" }, { v: "9", l: "Setembro" }, { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" },
  ];

  const stats: Stats[] = useMemo(() => {
    return brokers
      .filter((b: any) => ["ativo", "active", ""].includes(String(b.status || "").toLowerCase().trim()))
      .filter((b: any) => !restrictToAgency || !myAgencyId || b.agency_id === myAgencyId)
      .map((b: any) => {
        const brokerLeads = leads.filter((l: any) => (l.user_id === b.user_id || l.created_by === b.user_id) && inPeriod(l.created_at));
        const brokerNegs = negotiations.filter((n: any) => n.broker_id === b.id && inPeriod(n.created_at));
        const brokerSales = sales.filter((s: any) => s.broker_id === b.id && !["distrato", "cancelada"].includes(String(s.status || "").toLowerCase()) && inPeriod(s.sale_date));

        const nLeads = brokerLeads.length;
        const nAtendimento = brokerLeads.filter((l: any) => ["atendimento", "convertido"].includes(String(l.status))).length;
        const nFollowUp = brokerLeads.filter((l: any) => String(l.status) === "atendimento").length;
        const nNeg = brokerNegs.length;
        const nVendas = brokerSales.filter((s: any) => String(s.tipo || "venda") === "venda").length;
        const nCapt = brokerSales.filter((s: any) => String(s.tipo) === "captacao").length;
        const vgv = brokerSales.reduce((sum: number, s: any) => sum + (Number(s.vgv) || Number(s.property_value) || 0), 0);
        const conversao = nLeads > 0 ? (nVendas / nLeads) * 100 : 0;

        return {
          brokerId: b.id,
          userId: b.user_id,
          name: b.name,
          avatar: b.avatar_url,
          leads: nLeads,
          atendimentos: nAtendimento,
          followups: nFollowUp,
          negociacoes: nNeg,
          vendas: nVendas,
          captacoes: nCapt,
          vgv,
          conversao,
          points: nLeads * POINTS.lead + nAtendimento * POINTS.atendimento + nFollowUp * POINTS.followup + nNeg * POINTS.negociacao + nVendas * POINTS.venda + nCapt * POINTS.captacao,
          ipm: 0,
        };
      })
      .filter((s) => (s.leads + s.negociacoes + s.vendas + s.captacoes) > 0);
  }, [brokers, leads, negotiations, sales, month, year, restrictToAgency, myAgencyId]);

  const enriched = useMemo(() => {
    const max = {
      leads: Math.max(1, ...stats.map(s => s.leads)),
      atend: Math.max(1, ...stats.map(s => s.atendimentos)),
      neg: Math.max(1, ...stats.map(s => s.negociacoes)),
      vendas: Math.max(1, ...stats.map(s => s.vendas)),
    };
    return stats.map(s => ({
      ...s,
      ipm: (s.leads / max.leads) * 20 + (s.atendimentos / max.atend) * 20 + (s.negociacoes / max.neg) * 20 + (s.vendas / max.vendas) * 40,
    })).sort((a, b) => b.ipm - a.ipm);
  }, [stats]);

  const totals = useMemo(() => ({
    vgv: enriched.reduce((a, s) => a + s.vgv, 0),
    vendas: enriched.reduce((a, s) => a + s.vendas, 0),
    leads: enriched.reduce((a, s) => a + s.leads, 0),
    negociacoes: enriched.reduce((a, s) => a + s.negociacoes, 0),
  }), [enriched]);

  const podium = enriched.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  const saveName = async () => {
    updateSettings({ gaming_name: nameDraft.trim() || "LIGA DOS CAMPEÕES" } as any);
    setEditing(false);
  };

  // Recent Events for Ticker
  const recentEvents = useMemo(() => {
    const events: { id: string, text: string, type: 'sale' | 'lead' | 'neg' }[] = [];
    
    // Last 5 sales
    sales.slice(0, 5).forEach((s: any) => {
      const broker = brokers.find(b => b.id === s.broker_id);
      if (broker) {
        events.push({
          id: `sale-${s.id}`,
          text: `NOVA VENDA! ${broker.name.split(' ')[0]} ACABA DE FECHAR ${formatCurrency(s.vgv)}`,
          type: 'sale'
        });
      }
    });

    // Last 5 leads
    leads.slice(0, 5).forEach((l: any) => {
      const broker = brokers.find(b => b.user_id === l.user_id);
      if (broker) {
        events.push({
          id: `lead-${l.id}`,
          text: `NOVO LEAD! ${broker.name.split(' ')[0]} RECEBEU UM CLIENTE DE ${l.origem || 'Origem Direta'}`,
          type: 'lead'
        });
      }
    });

    return events.sort(() => Math.random() - 0.5);
  }, [sales, leads, brokers]);

  return (
    <div className={cn(
      "min-h-screen relative bg-[#F8FAFF] dark:bg-[#0A0D1E] text-foreground selection:bg-primary/30 transition-colors duration-700 shadow-inner overflow-y-auto overflow-x-hidden",
      tvMode && "fixed inset-0 z-[100] bg-[#F8FAFF] dark:bg-[#0A0D1E] lg:ml-0 overflow-y-auto"
    )}>
      {/* Dynamic Arena Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 w-full h-full opacity-40 dark:opacity-20"
          animate={{ 
            background: [
              "radial-gradient(circle at 20% 20%, #2563EB22, transparent 60%)",
              "radial-gradient(circle at 80% 80%, #2563EB22, transparent 60%)",
              "radial-gradient(circle at 20% 20%, #2563EB22, transparent 60%)",
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 opacity-30 dark:opacity-10" style={{ backgroundImage: "linear-gradient(#2563EB11 1px, transparent 1px), linear-gradient(90deg, #2563EB11 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <ConfettiCanvas active={confetti} />
      {!tvMode && <Navigation />}

      <main className={cn(
        "relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 transition-all duration-500",
        !tvMode && "lg:ml-72"
      )}>
        <div className={cn("max-w-7xl mx-auto space-y-6", tvMode && "max-w-none")}>
          
          {tvMode && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTvMode(false)}
              className="fixed top-4 right-4 z-[110] bg-background/50 backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </Button>
          )}
          
          {/* Header Broadcast Style */}
          <div className="relative overflow-hidden p-6 sm:p-10 rounded-[2rem] border bg-card/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(37,99,235,0.15)] transition-all border-primary/20 z-20" style={{ clipPath: ANGULAR_CLIP }}>
             {/* Corporate Accent Notches */}
             <div className="absolute top-0 left-0 h-2 w-32 bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
             <div className="absolute bottom-0 right-0 h-2 w-32 bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
             
             <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 grid place-items-center shadow-inner relative group border border-primary/20">
                    <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    {logo ? <img src={logo} className="w-12 h-12 object-contain" /> : <Trophy className="w-10 h-10 text-primary" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronização em Tempo Real
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest opacity-60 border-primary/20">EDição {year}</Badge>
                    </div>
                    {editing ? (
                      <div className="flex gap-2">
                        <Input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="font-black uppercase tracking-tighter text-2xl border-primary/30" autoFocus />
                        <Button size="icon" onClick={saveName} className="bg-primary text-white"><Check className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter leading-tight text-foreground relative z-30 break-words max-w-full" style={{ fontFamily: DISPLAY }}>{screenName}</h1>
                        {canEdit && <Button size="icon" variant="ghost" onClick={() => setEditing(true)} className="opacity-40 hover:opacity-100 hover:bg-primary/10"><Pencil className="w-4 h-4" /></Button>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                   <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border">
                      <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[130px] h-9 border-0 bg-transparent font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={year} onValueChange={setYear} disabled={month === "all"}>
                        <SelectTrigger className="w-[100px] h-9 border-0 bg-transparent font-bold text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                   <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open(window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'tv=true', '_blank')} 
                        className={cn("font-bold uppercase tracking-widest text-[10px] transition-all hover:shadow-md", tvMode && "bg-primary text-white border-primary")}
                      >
                        {tvMode ? <Maximize2 className="w-4 h-4 mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
                        Modo TV
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSoundEnabled(!soundEnabled)}>
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" onClick={triggerCelebration} className="font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                        <Zap className="w-4 h-4 mr-2" /> Comemorar
                      </Button>
                   </div>
                </div>
             </div>

             {/* Hero Stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                {[
                  { l: "VGV Total", v: formatCurrency(totals.vgv), i: DollarSign, color: "text-emerald-600" },
                  { l: "Vendas", v: totals.vendas, i: Trophy, color: "text-amber-500" },
                  { l: "Leads", v: totals.leads, i: Flame, color: "text-orange-500" },
                  { l: "Negociações", v: totals.negociacoes, i: Handshake, color: "text-primary" },
                ].map((k) => (
                  <div key={k.l} className="p-4 rounded-2xl bg-muted/30 border border-primary/5 hover:bg-muted/50 transition-colors group shadow-sm hover:shadow-md">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 flex items-center gap-1.5">
                      <k.i className={cn("w-3 h-3", k.color)} /> {k.l}
                    </p>
                    <p className="text-xl sm:text-2xl font-black tabular-nums tracking-tight group-hover:scale-105 transition-transform origin-left">{k.v}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Main Grid: Podium & Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Podium Glass Pedestals */}
            <div className="lg:col-span-3 p-8 sm:p-12 rounded-[2rem] border bg-card/40 backdrop-blur-md relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10" style={{ clipPath: ANGULAR_CLIP }}>
               <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" style={{ background: "radial-gradient(circle at 50% 100%, hsl(var(--primary)), transparent 80%)" }} />
               
               <div className="relative text-center mb-12">
                  <h2 className="text-3xl font-black uppercase tracking-[0.2em] inline-flex items-center gap-3 relative z-30" style={{ fontFamily: DISPLAY }}>
                    <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" /> Pódio Master <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                  </h2>
               </div>

               <div className="relative flex items-end justify-center gap-2 sm:gap-8 min-h-[420px] pb-4 overflow-x-auto no-scrollbar">
                 {podiumOrder.map((s) => {
                    const pos = enriched.indexOf(s) + 1;
                    const isFirst = pos === 1;
                    const isSecond = pos === 2;
                    const isThird = pos === 3;
                    
                    const pedestalColors = isFirst 
                      ? "from-amber-400 via-yellow-500 to-amber-600 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.3)]" 
                      : isSecond 
                        ? "from-slate-300 via-slate-400 to-slate-500 border-slate-200 shadow-[0_0_20px_rgba(148,163,184,0.2)]" 
                        : "from-amber-700 via-amber-800 to-amber-900 border-amber-600 shadow-[0_0_20px_rgba(180,83,9,0.2)]";

                    return (
                      <motion.div key={s.brokerId} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center flex-1 min-w-[120px] max-w-[200px] relative z-20">
                         <div className="relative mb-8">
                           <AnimatePresence>
                             {isFirst && (
                               <motion.div className="absolute inset-0 -m-6 rounded-full bg-amber-400/30 blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
                             )}
                           </AnimatePresence>
                           <Avatar className={cn("ring-offset-background transition-all duration-500", isFirst ? "h-28 w-28 sm:h-36 sm:w-36 ring-8 ring-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)] scale-110" : isSecond ? "h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-slate-400 shadow-xl" : "h-18 w-18 sm:h-22 sm:w-22 ring-4 ring-amber-800 shadow-lg")}>
                             <AvatarImage src={s.avatar || undefined} className="object-cover" />
                             <AvatarFallback className="font-black text-2xl bg-muted">{s.name.slice(0,2)}</AvatarFallback>
                           </Avatar>
                           {isFirst && <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]"><Crown className="w-14 h-14 text-amber-400 animate-bounce" /></div>}
                         </div>
                         
                         <div className="text-center mb-6 z-10">
                           <p className={cn("font-black uppercase leading-tight line-clamp-1 mb-1 tracking-tight text-foreground", isFirst ? "text-xl sm:text-2xl" : "text-sm sm:text-base")} style={{ fontFamily: DISPLAY }}>{s.name}</p>
                           <Badge variant={isFirst ? "default" : "secondary"} className={cn("font-black tabular-nums px-3 py-1", isFirst && "bg-amber-500 hover:bg-amber-600 text-black")}>{s.points.toLocaleString()} PTS</Badge>
                         </div>

                         <div className={cn("w-full rounded-t-[2.5rem] border-x border-t relative group overflow-hidden transition-all duration-700 bg-gradient-to-b z-10", pedestalColors, isFirst ? "h-64" : isSecond ? "h-44" : "h-32")}>
                            <div className="absolute inset-0 bg-white/10 opacity-20 animate-pulse" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)]" />
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-6xl sm:text-8xl font-black text-white/20 italic tracking-tighter drop-shadow-lg" style={{ fontFamily: DISPLAY }}>{pos}</div>
                            {isFirst && <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30" />}
                         </div>
                      </motion.div>
                    );
                  })}
               </div>
            </div>

            {/* Ranking List */}
            <div className="lg:col-span-2 p-6 rounded-[2rem] border bg-card/60 backdrop-blur-md flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10" style={{ clipPath: ANGULAR_CLIP }}>
               <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="font-black uppercase tracking-wider text-sm flex items-center gap-2" style={{ fontFamily: DISPLAY }}><Medal className="w-4 h-4 text-primary" /> Ranking IPM</h3>
                    <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest mt-1">Top 10 Performance</p>
                 </div>
                 <Badge variant="outline" className="font-black text-[10px] tracking-widest">REAL-TIME</Badge>
               </div>

               <div className="space-y-3 flex-1">
                 {enriched.slice(0, 10).map((s, i) => {
                    const isTop = i < 3;
                    return (
                      <motion.div key={s.brokerId} layout className="group flex items-center gap-3 p-3 rounded-2xl border bg-muted/20 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-default">
                        <div className={cn("w-10 h-10 rounded-xl grid place-items-center font-black italic", isTop ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground")} style={{ fontFamily: DISPLAY }}>{i + 1}</div>
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={s.avatar || undefined} className="object-cover" />
                          <AvatarFallback>{s.name.slice(0,2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm truncate uppercase tracking-tight" style={{ fontFamily: DISPLAY }}>{s.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                              <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${s.ipm}%` }} />
                            </div>
                            <span className="text-[10px] font-black opacity-40">{s.ipm.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black tabular-nums text-sm">{s.points}</p>
                          <p className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">POINTS</p>
                        </div>
                      </motion.div>
                    );
                 })}
               </div>
            </div>

          </div>

          {/* Secondary Stats & Missions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="rounded-[2rem] border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
                <CardContent className="p-8">
                   <h3 className="font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ fontFamily: DISPLAY }}><Target className="w-5 h-5 text-primary" /> Missões Ativas</h3>
                   <div className="space-y-4">
                      {[
                        { n: "Prospectador Pro", d: "Cadastre 10 novos leads", p: (enriched[0]?.leads ?? 0) / 10 * 100, r: "500 PTS" },
                        { n: "Mestre da Conversão", d: "Feche 2 vendas no período", p: (enriched[0]?.vendas ?? 0) / 2 * 100, r: "1000 PTS" },
                      ].map(m => (
                        <div key={m.n} className="p-4 rounded-2xl bg-muted/30 border border-primary/5 space-y-3">
                           <div className="flex justify-between items-center">
                             <p className="font-bold text-sm">{m.n}</p>
                             <Badge className="bg-primary/10 text-primary border-0 font-bold">{m.r}</Badge>
                           </div>
                           <p className="text-xs opacity-50">{m.d}</p>
                           <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                             <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${Math.min(100, m.p)}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             <Card className="rounded-[2rem] border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
                <CardContent className="p-8">
                   <h3 className="font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ fontFamily: DISPLAY }}><TrendingUp className="w-5 h-5 text-emerald-500" /> Como Pontuar</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        ["Venda", POINTS.venda], ["Negociação", POINTS.negociacao], ["Proposta", POINTS.proposta], ["Visita", POINTS.visita], ["Lead", POINTS.lead], ["Atendimento", POINTS.atendimento]
                      ].map(([l, p]) => (
                        <div key={l as string} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-primary/5 hover:bg-primary/5 transition-colors">
                          <span className="text-xs font-bold opacity-60 uppercase tracking-wider">{l}</span>
                          <span className="text-xs font-black text-primary">+{p}</span>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </div>

        </div>
      </main>

      {/* Corporate Broadcast Ticker */}
      <div className="fixed bottom-0 left-0 w-full h-14 bg-card/95 backdrop-blur-xl border-t border-primary/20 z-[105] flex items-center overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="bg-primary h-full px-8 flex items-center gap-3 skew-x-[-15deg] -ml-4 z-10 shadow-[10px_0_30px_rgba(37,99,235,0.3)] border-r border-white/20">
          <div className="skew-x-[15deg] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-black tracking-widest text-[10px] uppercase">PLANTÃO DE VENDAS</span>
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden h-full flex items-center">
          <motion.div 
            className="flex whitespace-nowrap gap-32 items-center"
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
          >
            {recentEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-4">
                <div className={cn(
                  "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter",
                  e.type === 'sale' ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-primary/20 text-primary"
                )}>
                  {e.type === 'sale' ? 'VENDA' : 'NOVO LEAD'}
                </div>
                <span className="text-foreground font-bold uppercase tracking-wide text-[11px] font-sans">
                  {e.text}
                </span>
                <span className="text-primary/30 font-black tracking-widest px-4">|</span>
              </div>
            ))}
            {/* Repeat for continuous loop */}
            {recentEvents.map((e) => (
              <div key={`${e.id}-clone`} className="flex items-center gap-4">
                <div className={cn(
                  "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter",
                  e.type === 'sale' ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-primary/20 text-primary"
                )}>
                  {e.type === 'sale' ? 'VENDA' : 'NOVO LEAD'}
                </div>
                <span className="text-foreground font-bold uppercase tracking-wide text-[11px] font-sans">
                  {e.text}
                </span>
                <span className="text-primary/30 font-black tracking-widest px-4">|</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="bg-muted/50 h-full px-10 flex items-center border-l border-border/50 hidden md:flex">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-primary tracking-widest uppercase mb-0.5">VGV Global do Mês</span>
            <span className="text-foreground font-sans font-black text-sm tabular-nums tracking-tight">{formatCurrency(totals.vgv)}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shine {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Gaming;
