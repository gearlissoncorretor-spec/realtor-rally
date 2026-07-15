import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Trophy, Flame, Phone, Handshake, DollarSign, TrendingUp, Target, Pencil, Check, X, Sparkles, Medal, Volume2, VolumeX, Crown, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseLocalDate } from "@/utils/dateParsing";
import { cn } from "@/lib/utils";
import { ConfettiCanvas, useRankingSounds } from "@/components/ranking/RankingEffects";
import { CountUp } from "@/components/gaming/CountUp";

const SERIF = "'Playfair Display', Georgia, serif";


// ============ My Broker Arena Palette ============
// #0241F1 azul principal · #021944 azul escuro · #E6E7FB branco azulado
const MB = {
  blue: "#0241F1",
  navy: "#021944",
  ice: "#E6E7FB",
};
const BLUE_GLOW = "#3b6bff";
const GRAPHITE_2 = "#01235c";
const GOLD = "#FFD54A";
const SILVER = "#D8DEE9";
const BRONZE = "#CD7F32";


// ============ Regras de pontuação ============
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
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => { setNameDraft((settings as any)?.gaming_name || "Liga dos Campeões My Broker"); }, [settings]);
  const screenName = (settings as any)?.gaming_name || "Liga dos Campeões My Broker";

  const { playVictory, playReveal, playCelebration, soundEnabled, setSoundEnabled } = useRankingSounds();
  const [confetti, setConfetti] = useState(false);
  const triggerCelebration = () => {
    setConfetti(true);
    playCelebration();
    setTimeout(() => setConfetti(false), 3500);
  };
  useEffect(() => {
    if (soundEnabled) {
      playVictory();
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  const now = new Date();
  // Se o mês atual ainda não tem vendas, abre no mês anterior (campeões do mês passado)
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
    { v: "all", l: "Todos" },
    { v: "1", l: "Janeiro" }, { v: "2", l: "Fevereiro" }, { v: "3", l: "Março" },
    { v: "4", l: "Abril" }, { v: "5", l: "Maio" }, { v: "6", l: "Junho" },
    { v: "7", l: "Julho" }, { v: "8", l: "Agosto" }, { v: "9", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" },
  ];

  const stats: Stats[] = useMemo(() => {
    return brokers
      .filter((b: any) => {
        const s = String(b.status || "").toLowerCase().trim();
        return s === "ativo" || s === "active" || s === "";
      })
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

        const points =
          nLeads * POINTS.lead +
          nAtendimento * POINTS.atendimento +
          nFollowUp * POINTS.followup +
          nNeg * POINTS.negociacao +
          nVendas * POINTS.venda +
          nCapt * POINTS.captacao;

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
          points,
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
      ipm:
        (s.leads / max.leads) * 20 +
        (s.atendimentos / max.atend) * 20 +
        (s.negociacoes / max.neg) * 20 +
        (s.vendas / max.vendas) * 40,
    })).sort((a, b) => b.ipm - a.ipm);
  }, [stats]);

  const categories = useMemo(() => ({
    cacadores: [...enriched].filter(s => s.leads > 0).sort((a, b) => b.leads - a.leads).slice(0, 5),
    atendimento: [...enriched].filter(s => s.atendimentos > 0).sort((a, b) => b.atendimentos - a.atendimentos).slice(0, 5),
    negociacao: [...enriched].filter(s => s.negociacoes > 0).sort((a, b) => b.negociacoes - a.negociacoes).slice(0, 5),
    fechador: [...enriched].filter(s => s.vgv > 0).sort((a, b) => b.vgv - a.vgv).slice(0, 5),
    conversao: [...enriched].filter(s => s.leads >= 3 && s.vendas > 0).sort((a, b) => b.conversao - a.conversao).slice(0, 5),
  }), [enriched]);

  const totals = useMemo(() => ({
    vgv: enriched.reduce((a, s) => a + s.vgv, 0),
    vendas: enriched.reduce((a, s) => a + s.vendas, 0),
    leads: enriched.reduce((a, s) => a + s.leads, 0),
    negociacoes: enriched.reduce((a, s) => a + s.negociacoes, 0),
  }), [enriched]);

  const saveName = async () => {
    const v = nameDraft.trim() || "Liga dos Campeões My Broker";
    updateSettings({ gaming_name: v } as any);
    setEditing(false);
  };

  const podium = enriched.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, ${MB.blue}44 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 100% 100%, ${MB.blue}22 0%, transparent 70%),
          linear-gradient(180deg, ${MB.navy} 0%, #0d0d10 60%, #050507 100%)
        `,
      }}
    >
      {/* Stadium light rays */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140%] h-[500px] opacity-40 blur-3xl"
          style={{ background: `conic-gradient(from 220deg at 50% 0%, transparent 0deg, ${MB.blue}66 45deg, transparent 90deg, ${MB.ice}22 180deg, transparent 270deg, ${MB.blue}55 315deg, transparent 360deg)` }}
        />
        {/* Grid floor */}
        <div
          className="absolute inset-x-0 bottom-0 h-[60vh] opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(${MB.ice} 1px, transparent 1px), linear-gradient(90deg, ${MB.ice} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            transform: "perspective(600px) rotateX(65deg)",
            transformOrigin: "bottom",
            maskImage: "linear-gradient(to top, black, transparent)",
          }}
        />
      </div>

      <ConfettiCanvas active={confetti} />

      <Navigation />
      <main className="relative lg:ml-72 pt-16 pb-24 lg:pb-8 px-3 sm:px-6 lg:px-8" style={{ color: MB.ice }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ============ HERO / BROADCAST HEADER ============ */}
          <div
            className="relative overflow-hidden rounded-3xl border p-5 sm:p-8"
            style={{
              borderColor: `${MB.blue}55`,
              background: `linear-gradient(135deg, ${MB.navy}ee 0%, #1f1f24 50%, ${MB.navy}ee 100%)`,
              boxShadow: `0 0 60px ${MB.blue}33, inset 0 1px 0 ${MB.ice}22`,
            }}
          >
            {/* Animated shine */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 20% 0%, ${MB.blue}88, transparent 50%)` }} />
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl opacity-40" style={{ background: MB.blue }} />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {logo ? (
                  <div className="w-16 h-16 rounded-2xl grid place-items-center bg-white/95 shadow-xl shrink-0 p-2">
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl grid place-items-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${MB.blue}, ${BLUE_GLOW})`, boxShadow: `0 0 30px ${MB.blue}88` }}
                  >
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: `${MB.blue}22`, color: MB.ice, border: `1px solid ${MB.blue}66` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> AO VIVO
                    </span>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">Season {now.getFullYear()}</span>
                  </div>
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <Input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="h-10 w-64 bg-white/10 border-white/30 text-white text-xl font-black" autoFocus />
                      <Button size="icon" variant="ghost" onClick={saveName} className="text-white hover:bg-white/10"><Check className="w-5 h-5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(false)} className="text-white hover:bg-white/10"><X className="w-5 h-5" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1
                        className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-none"
                        style={{
                          background: `linear-gradient(180deg, ${MB.ice} 0%, #ffffff 40%, ${MB.blue} 100%)`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          textShadow: `0 0 40px ${MB.blue}55`,
                          fontFamily: "'Sora', system-ui, sans-serif",
                        }}
                      >
                        {screenName}
                      </h1>
                      {canEdit && (
                        <Button size="icon" variant="ghost" onClick={() => setEditing(true)} className="text-white/70 hover:text-white hover:bg-white/10">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-sm mt-1 opacity-70 tracking-wide">Os melhores corretores disputam o topo em tempo real</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/15 backdrop-blur"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {soundEnabled ? "Som ON" : "Som OFF"}
                </Button>
                <Button
                  size="sm"
                  onClick={triggerCelebration}
                  className="gap-1.5 font-bold text-white border-0"
                  style={{ background: `linear-gradient(135deg, ${MB.blue}, ${BLUE_GLOW})`, boxShadow: `0 8px 24px ${MB.blue}66` }}
                >
                  <Zap className="w-4 h-4" />
                  Comemorar
                </Button>
              </div>
            </div>

            {/* Scoreboard strip */}
            <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "VGV Total", value: formatCurrency(totals.vgv), icon: DollarSign },
                { label: "Vendas", value: totals.vendas, icon: Trophy },
                { label: "Leads", value: totals.leads, icon: Flame },
                { label: "Negociações", value: totals.negociacoes, icon: Handshake },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-xl p-3 border backdrop-blur-sm"
                  style={{ borderColor: `${MB.blue}44`, background: `${MB.navy}88` }}
                >
                  <div className="flex items-center gap-2 opacity-70 text-[11px] uppercase tracking-wider">
                    <k.icon className="w-3.5 h-3.5" />
                    {k.label}
                  </div>
                  <div className="text-xl sm:text-2xl font-black tabular-nums mt-1" style={{ color: MB.ice, fontFamily: "'Sora', system-ui" }}>
                    {k.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Period filters */}
            <div className="relative flex items-center gap-2 flex-wrap mt-5">
              <Select value={month} onValueChange={(v) => { setMonth(v); playReveal(); }}>
                <SelectTrigger className="w-[150px] h-9 border-white/20 text-white" style={{ background: `${MB.navy}bb` }}><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear} disabled={month === "all"}>
                <SelectTrigger className="w-[110px] h-9 border-white/20 text-white" style={{ background: `${MB.navy}bb` }}><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ============ PÓDIO ============ */}
          {podium.length > 0 && (
            <div
              className="relative overflow-hidden rounded-3xl border p-6 sm:p-10"
              style={{
                borderColor: `${MB.blue}44`,
                background: `linear-gradient(180deg, #1a1a1f 0%, ${MB.navy} 100%)`,
                boxShadow: `inset 0 0 80px ${MB.blue}22`,
              }}
            >
              {/* Spotlight */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
                style={{ background: `radial-gradient(ellipse at top, ${MB.ice}22, transparent 60%)` }} />

              <div className="relative flex items-center justify-center gap-2 mb-8">
                <Crown className="w-6 h-6" style={{ color: MB.ice }} />
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-[0.2em]" style={{ color: MB.ice, fontFamily: "'Sora', system-ui" }}>
                  Pódio dos Campeões
                </h2>
                <Crown className="w-6 h-6" style={{ color: MB.ice }} />
              </div>

              <div className="relative flex items-end justify-center gap-4 sm:gap-8">
                {podiumOrder.map((s) => {
                  const pos = enriched.indexOf(s) + 1;
                  const heights = { 1: "h-52 sm:h-64", 2: "h-36 sm:h-44", 3: "h-28 sm:h-32" } as const;
                  const gradients = {
                    1: `linear-gradient(180deg, ${GOLD} 0%, #FFB84A 55%, #B8860B 100%)`,
                    2: `linear-gradient(180deg, #FFFFFF 0%, ${SILVER} 55%, #8892A6 100%)`,
                    3: `linear-gradient(180deg, #F5B278 0%, ${BRONZE} 55%, #7A4A1F 100%)`,
                  } as const;
                  const glows = {
                    1: `0 0 80px ${GOLD}aa, 0 0 30px #ffffff66`,
                    2: `0 0 50px ${SILVER}88`,
                    3: `0 0 40px ${BRONZE}88`,
                  } as const;
                  return (
                    <div key={s.brokerId} className="flex flex-col items-center gap-3 flex-1 max-w-[180px]">
                      {pos === 1 && (
                        <Crown className="w-10 h-10 animate-bounce" style={{ color: MB.ice, filter: `drop-shadow(0 0 12px ${MB.blue})` }} />
                      )}
                      <div className="relative">
                        <Avatar className={cn("shrink-0 ring-4", pos === 1 ? "h-24 w-24 sm:h-28 sm:w-28" : "h-16 w-16 sm:h-20 sm:w-20")}
                          style={{
                            boxShadow: glows[pos as 1 | 2 | 3],
                            ...(pos === 1 ? { border: `3px solid ${MB.ice}` } : {}),
                          } as any}
                        >
                          <AvatarImage src={s.avatar || undefined} />
                          <AvatarFallback className="text-white font-black" style={{ background: MB.blue }}>
                            {s.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {pos === 1 && <Sparkles className="absolute -top-2 -right-2 w-6 h-6 animate-pulse" style={{ color: MB.ice }} />}
                      </div>
                      <p className={cn("font-black text-center line-clamp-1 uppercase tracking-wide", pos === 1 ? "text-base sm:text-lg" : "text-xs sm:text-sm")}
                        style={{ color: MB.ice, fontFamily: "'Sora', system-ui" }}>
                        {s.name}
                      </p>
                      <div className="px-3 py-1 rounded-full text-xs font-bold tabular-nums"
                        style={{ background: `${MB.blue}33`, color: MB.ice, border: `1px solid ${MB.blue}66` }}>
                        {s.points.toLocaleString("pt-BR")} pts
                      </div>
                      <div
                        className={cn(
                          "w-full rounded-t-2xl grid place-items-center font-black text-3xl sm:text-5xl border-t-2",
                          heights[pos as 1 | 2 | 3],
                        )}
                        style={{
                          background: gradients[pos as 1 | 2 | 3],
                          color: pos === 1 ? "#3b1f00" : pos === 2 ? MB.navy : "#fff",
                          borderTopColor: MB.ice,
                          boxShadow: glows[pos as 1 | 2 | 3],
                          textShadow: pos !== 2 ? `0 2px 20px ${MB.navy}` : "none",
                          fontFamily: "'Sora', system-ui",
                        }}
                      >
                        {pos}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ IPM RANKING ============ */}
          <div
            className="rounded-3xl border overflow-hidden"
            style={{ borderColor: `${MB.blue}33`, background: `${MB.navy}cc`, backdropFilter: "blur(8px)" }}
          >
            <div className="p-5 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: `${MB.blue}22` }}>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2" style={{ color: MB.ice, fontFamily: "'Sora', system-ui" }}>
                  <Medal className="w-5 h-5" style={{ color: MB.blue }} />
                  Índice de Performance Master
                </h3>
                <p className="text-[11px] opacity-60 mt-0.5">20% cadastros · 20% atendimentos · 20% negociações · 40% vendas</p>
              </div>
              <Badge className="border-0 font-bold" style={{ background: MB.blue, color: "#fff" }}>IPM · Top 10</Badge>
            </div>
            <div className="p-4 space-y-2">
              {enriched.slice(0, 10).map((s, i) => {
                const level = getLevel(s.points);
                const next = getNextLevel(s.points);
                const progress = next ? Math.min(100, ((s.points - level.min) / (next.min - level.min)) * 100) : 100;
                const isTop = i < 3;
                return (
                  <div
                    key={s.brokerId}
                    className="rounded-xl border p-3 flex items-center gap-3 transition-all hover:translate-x-1"
                    style={{
                      borderColor: isTop ? `${MB.blue}66` : `${MB.blue}22`,
                      background: isTop
                        ? `linear-gradient(90deg, ${MB.blue}22 0%, transparent 100%)`
                        : `${MB.navy}88`,
                    }}
                  >
                    <div
                      className="w-10 h-10 grid place-items-center rounded-xl font-black text-base shrink-0"
                      style={{
                        background: isTop ? `linear-gradient(135deg, ${MB.blue}, ${BLUE_GLOW})` : `${MB.navy}`,
                        color: MB.ice,
                        border: `1px solid ${MB.blue}66`,
                        boxShadow: isTop ? `0 0 20px ${MB.blue}66` : "none",
                        fontFamily: "'Sora', system-ui",
                      }}
                    >
                      {i + 1}
                    </div>
                    <Avatar className="h-11 w-11 shrink-0 ring-2" style={{ boxShadow: `0 0 0 2px ${MB.blue}44` } as any}>
                      <AvatarImage src={s.avatar || undefined} />
                      <AvatarFallback className="text-white text-xs" style={{ background: MB.blue }}>
                        {s.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate" style={{ color: MB.ice }}>{s.name}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{ background: `${MB.blue}33`, color: MB.ice, border: `1px solid ${MB.blue}66` }}>
                          {level.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${MB.blue}22` }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${MB.blue}, ${MB.ice})` }} />
                        </div>
                        <span className="text-[10px] opacity-70 shrink-0 tabular-nums">{s.points.toLocaleString("pt-BR")} pts</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black tabular-nums" style={{ color: MB.ice, fontFamily: "'Sora', system-ui", textShadow: `0 0 20px ${MB.blue}` }}>
                        {s.ipm.toFixed(1)}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest opacity-60">IPM</p>
                    </div>
                  </div>
                );
              })}
              {enriched.length === 0 && (
                <p className="text-sm text-center py-10 opacity-60">Sem dados suficientes ainda. Comece cadastrando leads e negociações.</p>
              )}
            </div>
          </div>

          {/* ============ CATEGORIAS ============ */}
          <Tabs defaultValue="cacadores" onValueChange={() => playReveal()}>
            <TabsList
              className="w-full overflow-x-auto flex justify-start no-scrollbar h-auto p-1 rounded-2xl border"
              style={{ background: `${MB.navy}cc`, borderColor: `${MB.blue}33` }}
            >
              {[
                { v: "cacadores", i: Flame, l: "Caçador" },
                { v: "atendimento", i: Phone, l: "Atendimento" },
                { v: "negociacao", i: Handshake, l: "Negociação" },
                { v: "fechador", i: DollarSign, l: "Fechador" },
                { v: "conversao", i: TrendingUp, l: "Conversão" },
              ].map(t => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="gap-1.5 rounded-xl data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg font-semibold uppercase text-xs tracking-wider"
                  style={{
                    // active bg via inline style through class-hover is tricky — apply hover via className
                  }}
                >
                  <t.i className="w-4 h-4" />{t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <CategoryList value="cacadores" data={categories.cacadores} metric={s => `${s.leads} leads`} icon={<Flame className="w-4 h-4" style={{ color: MB.blue }} />} title="Caçador de Leads" />
            <CategoryList value="atendimento" data={categories.atendimento} metric={s => `${s.atendimentos} atendimentos`} icon={<Phone className="w-4 h-4" style={{ color: MB.blue }} />} title="Mestre do Atendimento" />
            <CategoryList value="negociacao" data={categories.negociacao} metric={s => `${s.negociacoes} negociações`} icon={<Handshake className="w-4 h-4" style={{ color: MB.blue }} />} title="Rei da Negociação" />
            <CategoryList value="fechador" data={categories.fechador} metric={s => formatCurrency(s.vgv)} icon={<DollarSign className="w-4 h-4" style={{ color: MB.blue }} />} title="Fechador do Mês" />
            <CategoryList value="conversao" data={categories.conversao} metric={s => `${s.conversao.toFixed(1)}%`} icon={<TrendingUp className="w-4 h-4" style={{ color: MB.blue }} />} title="Melhor Conversão (Lead → Venda)" />
          </Tabs>

          {/* ============ MISSÕES ============ */}
          <div
            className="rounded-3xl border p-5"
            style={{ borderColor: `${MB.blue}33`, background: `${MB.navy}cc`, backdropFilter: "blur(8px)" }}
          >
            <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 mb-4" style={{ color: MB.ice, fontFamily: "'Sora', system-ui" }}>
              <Target className="w-5 h-5" style={{ color: MB.blue }} />
              Missões da Semana
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Prospectador", desc: "Cadastre 10 novos clientes", reward: 100, current: enriched[0]?.leads ?? 0, goal: 10 },
                { name: "Negociador", desc: "Transforme 5 atendimentos em negociação", reward: 200, current: enriched[0]?.negociacoes ?? 0, goal: 5 },
                { name: "Vendedor", desc: "Feche 1 venda", reward: 500, current: enriched[0]?.vendas ?? 0, goal: 1 },
              ].map(m => {
                const pct = Math.min(100, (m.current / m.goal) * 100);
                const done = pct >= 100;
                return (
                  <div
                    key={m.name}
                    className="rounded-2xl border p-4 space-y-2 relative overflow-hidden"
                    style={{
                      borderColor: done ? MB.blue : `${MB.blue}33`,
                      background: done ? `linear-gradient(135deg, ${MB.blue}33, ${MB.navy})` : `${MB.navy}88`,
                      boxShadow: done ? `0 0 30px ${MB.blue}66` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-black text-sm uppercase tracking-wider" style={{ color: MB.ice }}>Missão {m.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: MB.blue, color: "#fff" }}>+{m.reward} pts</span>
                    </div>
                    <p className="text-xs opacity-70">{m.desc}</p>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: `${MB.blue}22` }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${MB.blue}, ${MB.ice})` }} />
                    </div>
                    <p className="text-[10px] opacity-70 text-right tabular-nums">{m.current}/{m.goal}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============ REGRAS DE PONTOS ============ */}
          <div
            className="rounded-3xl border p-5"
            style={{ borderColor: `${MB.blue}33`, background: `${MB.navy}cc`, backdropFilter: "blur(8px)" }}
          >
            <h3 className="text-lg font-black uppercase tracking-wider mb-4" style={{ color: MB.ice, fontFamily: "'Sora', system-ui" }}>
              Como ganhar pontos
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Novo cliente cadastrado", POINTS.lead],
                ["Cliente atendido", POINTS.atendimento],
                ["Cliente em follow-up", POINTS.followup],
                ["Virou negociação", POINTS.negociacao],
                ["Visita realizada", POINTS.visita],
                ["Proposta enviada", POINTS.proposta],
                ["Venda fechada", POINTS.venda],
                ["Captação de imóvel", POINTS.captacao],
                ["Meta mensal atingida", POINTS.metaMensal],
              ].map(([label, pts]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 border"
                  style={{ borderColor: `${MB.blue}22`, background: `${MB.navy}88` }}
                >
                  <span className="text-sm" style={{ color: MB.ice }}>{label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums" style={{ background: `${MB.blue}33`, color: MB.ice, border: `1px solid ${MB.blue}66` }}>
                    +{pts} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Active tab styling for tabs (since we use inline style, add via style tag) */}
      <style>{`
        [data-state="active"].gaming-tab { background: ${MB.blue} !important; color: #fff !important; }
      `}</style>
    </div>
  );
};

const CategoryList = ({ value, data, metric, icon, title }: {
  value: string;
  data: Stats[];
  metric: (s: Stats) => string;
  icon: React.ReactNode;
  title: string;
}) => (
  <TabsContent value={value}>
    <div
      className="rounded-3xl border p-5"
      style={{ borderColor: `${MB.blue}33`, background: `${MB.navy}cc`, backdropFilter: "blur(8px)" }}
    >
      <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2 mb-4" style={{ color: MB.ice, fontFamily: "'Sora', system-ui" }}>
        {icon}{title}
      </h3>
      <div className="space-y-2">
        {data.map((s, i) => {
          const isTop = i < 3;
          return (
            <div
              key={s.brokerId}
              className="flex items-center gap-3 rounded-xl p-3 border transition-all hover:translate-x-1"
              style={{
                borderColor: isTop ? `${MB.blue}55` : `${MB.blue}22`,
                background: isTop ? `linear-gradient(90deg, ${MB.blue}22, transparent)` : `${MB.navy}88`,
              }}
            >
              <div
                className="w-8 h-8 grid place-items-center rounded-lg text-sm font-black shrink-0"
                style={{
                  background: isTop ? `linear-gradient(135deg, ${MB.blue}, ${BLUE_GLOW})` : MB.navy,
                  color: MB.ice,
                  border: `1px solid ${MB.blue}66`,
                  boxShadow: isTop ? `0 0 12px ${MB.blue}66` : "none",
                  fontFamily: "'Sora', system-ui",
                }}
              >
                {i + 1}
              </div>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={s.avatar || undefined} />
                <AvatarFallback className="text-white text-xs" style={{ background: MB.blue }}>
                  {s.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate flex-1" style={{ color: MB.ice }}>{s.name}</p>
              <span className="text-sm font-black tabular-nums" style={{ color: MB.ice }}>{metric(s)}</span>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-sm text-center py-8 opacity-60">Sem dados no período.</p>
        )}
      </div>
    </div>
  </TabsContent>
);

export default Gaming;
