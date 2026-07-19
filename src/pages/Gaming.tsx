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
import { Trophy, Flame, Phone, Handshake, DollarSign, TrendingUp, Target, Pencil, Check, X, Sparkles, Medal, Volume2, VolumeX, Crown, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseLocalDate } from "@/utils/dateParsing";
import { cn } from "@/lib/utils";
import { ConfettiCanvas, useRankingSounds } from "@/components/ranking/RankingEffects";
import { CountUp } from "@/components/gaming/CountUp";

const DISPLAY = "'Chakra Petch', 'Rajdhani', 'Sora', system-ui, sans-serif";
const ANGULAR_CLIP = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";

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
  useEffect(() => { setNameDraft((settings as any)?.gaming_name || "Liga dos Campeões"); }, [settings]);
  const screenName = (settings as any)?.gaming_name || "Liga dos Campeões";

  const { playReveal, soundEnabled, setSoundEnabled } = useRankingSounds();
  const [confetti, setConfetti] = useState(false);
  const triggerCelebration = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3500);
  };

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

  const podium = enriched.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <ConfettiCanvas active={confetti} />
      <Navigation />

      <main className="lg:ml-72 pt-16 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start gap-4 p-6 rounded-3xl border bg-card shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 grid place-items-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">{screenName}</h1>
                <p className="text-muted-foreground">Competição ativa - Temporada {now.getFullYear()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => triggerCelebration()}><Zap className="w-4 h-4 mr-2" /> Comemorar</Button>
            </div>
          </header>

          {/* Grid Arena */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-primary/20 overflow-hidden">
               <CardContent className="p-6">
                 <h2 className="text-xl font-bold uppercase mb-8 flex items-center justify-center gap-2">
                   <Crown className="text-yellow-500" /> Pódio
                 </h2>
                 <div className="flex items-end justify-center gap-4 h-64">
                    {podiumOrder.map((s, idx) => (
                      <div key={s.brokerId} className="flex flex-col items-center flex-1">
                        <Avatar className={cn("mb-2 border-2", idx === 1 ? "w-20 h-20 border-yellow-500" : "w-16 h-16 border-slate-300")}>
                          <AvatarImage src={s.avatar || undefined} />
                          <AvatarFallback>{s.name.slice(0,2)}</AvatarFallback>
                        </Avatar>
                        <div className={cn("w-full rounded-t-lg grid place-items-center font-black", idx === 1 ? "h-32 bg-yellow-500" : "h-24 bg-slate-300")}>
                          {enriched.indexOf(s) + 1}º
                        </div>
                      </div>
                    ))}
                 </div>
               </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 uppercase text-sm text-muted-foreground">Ranking IPM</h3>
                <div className="space-y-4">
                  {enriched.slice(0, 5).map((s, i) => (
                    <div key={s.brokerId} className="flex items-center gap-3">
                      <div className="font-mono font-bold w-6 text-primary">{i + 1}º</div>
                      <Avatar className="w-8 h-8"><AvatarImage src={s.avatar || undefined} /></Avatar>
                      <div className="flex-1 font-semibold text-sm truncate">{s.name}</div>
                      <div className="text-xs font-bold bg-primary/10 px-2 py-1 rounded">{s.ipm.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Gaming;
