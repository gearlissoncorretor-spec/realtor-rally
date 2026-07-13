import { useMemo, useState, useEffect } from "react";
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
import ParticleEffect from "@/components/ranking/ParticleEffect";

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
  { name: "Iniciante", min: 0, max: 500, color: "text-slate-400", glow: "from-slate-500/20" },
  { name: "Corretor Bronze", min: 501, max: 1500, color: "text-amber-600", glow: "from-amber-600/20" },
  { name: "Corretor Prata", min: 1501, max: 3000, color: "text-slate-300", glow: "from-slate-300/20" },
  { name: "Corretor Ouro", min: 3001, max: 6000, color: "text-yellow-400", glow: "from-yellow-500/20" },
  { name: "Corretor Diamante", min: 6001, max: 10000, color: "text-cyan-300", glow: "from-cyan-400/20" },
  { name: "Lenda Master", min: 10001, max: Infinity, color: "text-fuchsia-400", glow: "from-fuchsia-500/20" },
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
  conversao: number; // % lead -> venda
  points: number;
  ipm: number; // 0-100
}

const Gaming = () => {
  const { brokers, sales } = useData();
  const { leads } = useLeads();
  const { negotiations } = useNegotiations();
  const { settings, updateSettings, isUpdating } = useOrganizationSettings();
  const { getUserRole, profile } = useAuth();
  const role = getUserRole?.() ?? "";
  const canEdit = ["diretor", "socio", "admin", "super_admin"].includes(role);
  const myAgencyId = (profile as any)?.agency_id ?? null;
  const restrictToAgency = role === "gerente" || role === "corretor";

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => { setNameDraft((settings as any)?.gaming_name || "Gaming Canedo"); }, [settings]);
  const screenName = (settings as any)?.gaming_name || "Gaming Canedo";

  // Sons + confetti
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

  // Filtro de período (padrão: mês atual)
  const now = new Date();
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [year, setYear] = useState<string>(String(now.getFullYear()));

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
      .filter((b: any) => String(b.status || "").toLowerCase() !== "inativo")
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
      // Só mostra corretores com atividade real no período selecionado
      .filter((s) => (s.leads + s.negociacoes + s.vendas + s.captacoes) > 0);
  }, [brokers, leads, negotiations, sales, month, year, restrictToAgency, myAgencyId]);

  // Normaliza IPM
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
    cacadores: [...enriched].sort((a, b) => b.leads - a.leads).slice(0, 5),
    atendimento: [...enriched].sort((a, b) => b.atendimentos - a.atendimentos).slice(0, 5),
    negociacao: [...enriched].sort((a, b) => b.negociacoes - a.negociacoes).slice(0, 5),
    fechador: [...enriched].sort((a, b) => b.vgv - a.vgv).slice(0, 5),
    conversao: [...enriched].filter(s => s.leads >= 3).sort((a, b) => b.conversao - a.conversao).slice(0, 5),
  }), [enriched]);

  const saveName = async () => {
    const v = nameDraft.trim() || "Gaming Canedo";
    updateSettings({ gaming_name: v } as any);
    setEditing(false);
  };

  const podium = enriched.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(240_60%_15%)_0%,_hsl(240_50%_8%)_50%,_hsl(240_60%_4%)_100%)]">
      {/* Arena background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <ParticleEffect />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.12),transparent_60%)]" />
      <ConfettiCanvas active={confetti} />

      <Navigation />
      <main className="relative lg:ml-72 pt-16 pb-24 lg:pb-8 px-3 sm:px-6 lg:px-8 text-slate-100">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 grid place-items-center shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-pulse">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="h-9 w-56 bg-white/10 border-white/20 text-white" autoFocus />
                  <Button size="icon" variant="ghost" onClick={saveName}><Check className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-yellow-300 via-amber-200 to-orange-300 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(250,204,21,0.35)] uppercase">
                    {screenName}
                  </h1>
                  {canEdit && (
                    <Button size="icon" variant="ghost" onClick={() => setEditing(true)} title="Editar nome" className="text-slate-300 hover:text-white">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 py-1.5 border-yellow-400/40 bg-yellow-400/10 text-yellow-200">
                <Sparkles className="w-3.5 h-3.5" />
                Arena dos Campeões
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10",
                  soundEnabled && "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                )}
                title={soundEnabled ? "Desativar som" : "Ativar som"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {soundEnabled ? "Som ON" : "Som OFF"}
              </Button>
              <Button
                size="sm"
                onClick={triggerCelebration}
                className="gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90 font-bold shadow-lg shadow-orange-500/30"
              >
                <Zap className="w-4 h-4" />
                Comemorar
              </Button>
            </div>
          </div>

          {/* Filtro de período */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={month} onValueChange={(v) => { setMonth(v); playReveal(); }}>
              <SelectTrigger className="w-[150px] h-9 bg-white/5 border-white/20 text-white"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear} disabled={month === "all"}>
              <SelectTrigger className="w-[110px] h-9 bg-white/5 border-white/20 text-white"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Pódio dos Campeões */}
          {podium.length > 0 && (
            <Card className="relative overflow-hidden border-yellow-400/20 bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(250,204,21,0.15),transparent_60%)] pointer-events-none" />
              <CardHeader className="pb-2 relative">
                <CardTitle className="flex items-center gap-2 text-yellow-200">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  Pódio dos Campeões
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-center gap-3 sm:gap-6 pt-8 pb-4">
                  {podiumOrder.map((s) => {
                    const pos = enriched.indexOf(s) + 1;
                    const heights = { 1: "h-40", 2: "h-28", 3: "h-20" } as const;
                    const colors = {
                      1: "from-yellow-400 to-amber-600 shadow-[0_0_40px_rgba(250,204,21,0.6)]",
                      2: "from-slate-300 to-slate-500 shadow-[0_0_25px_rgba(203,213,225,0.4)]",
                      3: "from-amber-600 to-amber-800 shadow-[0_0_20px_rgba(217,119,6,0.4)]",
                    } as const;
                    return (
                      <div key={s.brokerId} className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                        {pos === 1 && <Crown className="w-8 h-8 text-yellow-400 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />}
                        <Avatar className={cn("shrink-0 ring-4", pos === 1 ? "h-20 w-20 ring-yellow-400/60" : "h-14 w-14 ring-white/30")}>
                          <AvatarImage src={s.avatar || undefined} />
                          <AvatarFallback className="bg-slate-800 text-white">{s.name.split(" ").slice(0, 2).map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs sm:text-sm font-bold text-center text-white line-clamp-1">{s.name}</p>
                        <p className="text-[10px] text-yellow-200/80">{s.points.toLocaleString("pt-BR")} pts</p>
                        <div className={cn(
                          "w-full rounded-t-xl bg-gradient-to-t grid place-items-center font-black text-2xl sm:text-4xl text-black border-t-2 border-white/20",
                          heights[pos as 1 | 2 | 3],
                          colors[pos as 1 | 2 | 3]
                        )}>
                          {pos}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}



          {/* Ranking Geral / IPM */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-primary" />
                Índice de Performance Master (IPM)
              </CardTitle>
              <p className="text-xs text-muted-foreground">20% cadastros · 20% atendimentos · 20% negociações · 40% vendas</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {enriched.slice(0, 10).map((s, i) => {
                const level = getLevel(s.points);
                const next = getNextLevel(s.points);
                const progress = next ? Math.min(100, ((s.points - level.min) / (next.min - level.min)) * 100) : 100;
                return (
                  <div key={s.brokerId} className={cn(
                    "rounded-xl border p-3 flex items-center gap-3 bg-gradient-to-r",
                    i === 0 ? "from-yellow-500/10 border-yellow-500/30" : i === 1 ? "from-slate-400/10 border-slate-400/30" : i === 2 ? "from-amber-600/10 border-amber-600/30" : "from-transparent border-border/60"
                  )}>
                    <div className={cn("w-9 h-9 grid place-items-center rounded-full font-bold text-sm shrink-0",
                      i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-slate-300 text-black" : i === 2 ? "bg-amber-600 text-white" : "bg-muted text-foreground")}>
                      {i + 1}
                    </div>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={s.avatar || undefined} />
                      <AvatarFallback>{s.name.split(" ").slice(0, 2).map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{s.name}</p>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", level.color)}>{level.name}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground shrink-0">{s.points.toLocaleString("pt-BR")} pts</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black tabular-nums">{s.ipm.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">IPM</p>
                    </div>
                  </div>
                );
              })}
              {enriched.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes ainda. Comece cadastrando leads e negociações.</p>
              )}
            </CardContent>
          </Card>

          {/* Rankings por categoria */}
          <Tabs defaultValue="cacadores" onValueChange={() => playReveal()}>
            <TabsList className="w-full overflow-x-auto flex justify-start no-scrollbar">
              <TabsTrigger value="cacadores" className="gap-1.5"><Flame className="w-4 h-4" />Caçador de Leads</TabsTrigger>
              <TabsTrigger value="atendimento" className="gap-1.5"><Phone className="w-4 h-4" />Atendimento</TabsTrigger>
              <TabsTrigger value="negociacao" className="gap-1.5"><Handshake className="w-4 h-4" />Negociação</TabsTrigger>
              <TabsTrigger value="fechador" className="gap-1.5"><DollarSign className="w-4 h-4" />Fechador do Mês</TabsTrigger>
              <TabsTrigger value="conversao" className="gap-1.5"><TrendingUp className="w-4 h-4" />Conversão</TabsTrigger>
            </TabsList>

            <CategoryList value="cacadores" data={categories.cacadores} metric={s => `${s.leads} leads`} icon={<Flame className="w-4 h-4 text-orange-400" />} title="🔥 Caçador de Leads" />
            <CategoryList value="atendimento" data={categories.atendimento} metric={s => `${s.atendimentos} atendimentos`} icon={<Phone className="w-4 h-4 text-blue-400" />} title="📞 Mestre do Atendimento" />
            <CategoryList value="negociacao" data={categories.negociacao} metric={s => `${s.negociacoes} negociações`} icon={<Handshake className="w-4 h-4 text-emerald-400" />} title="🤝 Rei da Negociação" />
            <CategoryList value="fechador" data={categories.fechador} metric={s => formatCurrency(s.vgv)} icon={<DollarSign className="w-4 h-4 text-yellow-400" />} title="💰 Fechador do Mês" />
            <CategoryList value="conversao" data={categories.conversao} metric={s => `${s.conversao.toFixed(1)}%`} icon={<TrendingUp className="w-4 h-4 text-fuchsia-400" />} title="🚀 Melhor Conversão (Lead → Venda)" />
          </Tabs>

          {/* Missões Semanais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Missões da Semana</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Prospectador", desc: "Cadastre 10 novos clientes", reward: 100, current: enriched[0]?.leads ?? 0, goal: 10 },
                { name: "Negociador", desc: "Transforme 5 atendimentos em negociação", reward: 200, current: enriched[0]?.negociacoes ?? 0, goal: 5 },
                { name: "Vendedor", desc: "Feche 1 venda", reward: 500, current: enriched[0]?.vendas ?? 0, goal: 1 },
              ].map(m => {
                const pct = Math.min(100, (m.current / m.goal) * 100);
                return (
                  <div key={m.name} className="rounded-xl border border-border/60 bg-card/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">Missão {m.name}</p>
                      <Badge variant="outline" className="text-[10px]">+{m.reward} pts</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground text-right">{m.current}/{m.goal}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Tabela de pontos */}
          <Card>
            <CardHeader className="pb-3"><CardTitle>Como ganhar pontos</CardTitle></CardHeader>
            <CardContent>
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
                  <div key={label as string} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 bg-card/40">
                    <span className="text-sm">{label}</span>
                    <Badge variant="secondary">+{pts} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((s, i) => (
          <div key={s.brokerId} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
            <div className={cn("w-7 h-7 grid place-items-center rounded-full text-xs font-bold shrink-0",
              i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-slate-300 text-black" : i === 2 ? "bg-amber-600 text-white" : "bg-muted")}>
              {i + 1}
            </div>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={s.avatar || undefined} />
              <AvatarFallback>{s.name.split(" ").slice(0, 2).map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate flex-1">{s.name}</p>
            <span className="text-sm font-bold tabular-nums">{metric(s)}</span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Sem dados no período.</p>
        )}
      </CardContent>
    </Card>
  </TabsContent>
);

export default Gaming;
