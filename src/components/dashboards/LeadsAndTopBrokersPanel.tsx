import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Megaphone, Trophy, Target, TrendingUp, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCurrencyCompact } from "@/utils/formatting";
import type { Sale } from "@/contexts/DataContext";
import type { Database } from "@/integrations/supabase/types";
import type { Negotiation } from "@/hooks/useNegotiations";

type Broker = Database["public"]["Tables"]["brokers"]["Row"];

interface Props {
  negotiations: Negotiation[];
  sales: Sale[];
  brokers: Broker[];
}

// Normaliza origens (vendas + negociações) para buckets canônicos
const normalizeOrigem = (raw?: string | null): string => {
  const s = (raw || "").toLowerCase().trim();
  if (!s) return "Outros";
  if (s.includes("meta") || s.includes("facebook") || s.includes("fb ads") || s.includes("tráfego") || s.includes("trafego") || s.includes("patrocin")) return "Meta Ads";
  if (s.includes("insta")) return "Instagram";
  if (s.includes("indica")) return "Indicação";
  if (s.includes("google")) return "Google";
  if (s.includes("site") || s.includes("web") || s.includes("marketplace") || s.includes("portal")) return "Site";
  return "Outros";
};

const ORIGIN_META: Record<string, { color: string; bar: string }> = {
  "Meta Ads": { color: "text-[#1877F2]", bar: "bg-[#1877F2]" },
  Instagram: { color: "text-[#E1306C]", bar: "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
  Indicação: { color: "text-emerald-600", bar: "bg-emerald-500" },
  Google: { color: "text-[#EA4335]", bar: "bg-[#EA4335]" },
  Site: { color: "text-sky-600", bar: "bg-sky-500" },
  Outros: { color: "text-muted-foreground", bar: "bg-muted-foreground/60" },
};

const ORDER = ["Meta Ads", "Instagram", "Indicação", "Google", "Site", "Outros"];

const LeadsAndTopBrokersPanel = ({ negotiations, sales, brokers }: Props) => {
  const { rows, totalSales, totalVgv, bestChannel, ticketMedio } = useMemo(() => {
    // Fonte principal: VENDAS confirmadas (de onde vieram os clientes que compraram)
    const confirmedSales = sales.filter((s) => s.status === "confirmada");

    const counts: Record<string, number> = Object.fromEntries(ORDER.map((k) => [k, 0]));
    const vgvByOrigin: Record<string, number> = Object.fromEntries(ORDER.map((k) => [k, 0]));

    confirmedSales.forEach((s) => {
      const key = normalizeOrigem(s.origem);
      counts[key] = (counts[key] || 0) + 1;
      vgvByOrigin[key] = (vgvByOrigin[key] || 0) + Number(s.vgv || 0);
    });

    const totalSales = confirmedSales.length;
    const totalVgv = confirmedSales.reduce((sum, s) => sum + Number(s.vgv || 0), 0);
    const max = Math.max(1, ...Object.values(counts));
    const rows = ORDER.map((name) => ({
      name,
      count: counts[name] || 0,
      vgv: vgvByOrigin[name] || 0,
      pct: totalSales > 0 ? ((counts[name] || 0) / totalSales) * 100 : 0,
      width: ((counts[name] || 0) / max) * 100,
    }));
    const best = [...rows].sort((a, b) => b.vgv - a.vgv)[0];
    const ticket = totalSales > 0 ? totalVgv / totalSales : 0;

    return {
      rows,
      totalSales,
      totalVgv,
      bestChannel: best && best.count > 0 ? best.name : "—",
      ticketMedio: ticket,
    };
  }, [sales]);

  const topBrokers = useMemo(() => {
    const confirmed = sales.filter((s) => s.status === "confirmada");
    return brokers
      .map((broker) => {
        const bs = confirmed.filter(
          (s) => s.broker_id === broker.id && s.tipo === "venda" && s.parceria_tipo !== "Agência"
        );
        return {
          broker,
          salesCount: bs.length,
          totalVGV: bs.reduce((sum, s) => sum + Number(s.vgv || 0), 0),
        };
      })
      .filter((b) => b.salesCount > 0)
      .sort((a, b) => b.totalVGV - a.totalVGV)
      .slice(0, 5);
  }, [brokers, sales]);

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-4 h-4 text-amber-500" />;
    if (i === 1) return <Medal className="w-4 h-4 text-slate-400" />;
    if (i === 2) return <Medal className="w-4 h-4 text-orange-500" />;
    return <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>;
  };

  const rankEmoji = ["🥇", "🥈", "🥉", "", ""];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      {/* LEFT - 60% (3/5) */}
      <Card className="lg:col-span-3 border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> Origem dos Clientes (Vendas)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {totalSales === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Sem vendas confirmadas no período selecionado
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r, i) => {
                const meta = ORIGIN_META[r.name];
                return (
                  <div
                    key={r.name}
                    className="space-y-1.5 animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn("font-semibold", meta.color)}>{r.name}</span>
                      <span className="text-muted-foreground tabular-nums flex items-center gap-2">
                        <span className="font-bold text-foreground">{r.count}</span>
                        <span className="text-xs">({r.pct.toFixed(1)}%)</span>
                        <span className="text-xs text-muted-foreground/70" title={formatCurrency(r.vgv)}>
                          · {formatCurrencyCompact(r.vgv)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", meta.bar)}
                        style={{ width: `${r.width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* KPIs baseados em vendas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border/50">
            <KpiTile
              icon={<Users className="w-4 h-4" />}
              label="Total de Vendas"
              value={String(totalSales)}
            />
            <KpiTile
              icon={<Target className="w-4 h-4" />}
              label="VGV Total"
              value={formatCurrencyCompact(totalVgv)}
              hint={totalVgv > 0 ? formatCurrency(totalVgv) : undefined}
            />
            <KpiTile
              icon={<Trophy className="w-4 h-4" />}
              label="Melhor Canal"
              value={bestChannel}
              hint="por VGV"
            />
            <KpiTile
              icon={<TrendingUp className="w-4 h-4" />}
              label="Ticket Médio"
              value={formatCurrencyCompact(ticketMedio)}
              hint={ticketMedio > 0 ? formatCurrency(ticketMedio) : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* RIGHT - 40% (2/5) */}
      <Card className="lg:col-span-2 border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> TOP 5 Corretores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topBrokers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Sem vendas confirmadas no período
            </div>
          ) : (
            topBrokers.map((item, i) => {
              const initials = item.broker.name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();
              const isFirst = i === 0;
              return (
                <div
                  key={item.broker.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border transition-all animate-fade-in",
                    isFirst
                      ? "p-4 bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-transparent border-amber-500/30 shadow-md"
                      : "p-3 border-border/50 hover:bg-muted/30"
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="shrink-0 w-7 flex items-center justify-center">
                    {rankEmoji[i] ? (
                      <span className="text-xl">{rankEmoji[i]}</span>
                    ) : (
                      rankIcon(i)
                    )}
                  </div>
                  <Avatar className={cn("shrink-0", isFirst ? "h-12 w-12 ring-2 ring-amber-400/50" : "h-9 w-9")}>
                    <AvatarImage src={item.broker.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold truncate text-foreground", isFirst ? "text-base" : "text-sm")}>
                      {item.broker.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.salesCount} {item.salesCount === 1 ? "venda" : "vendas"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "font-bold tabular-nums",
                        isFirst ? "text-amber-600 dark:text-amber-400 text-base" : "text-sm text-foreground"
                      )}
                      title={formatCurrency(item.totalVGV)}
                    >
                      {formatCurrencyCompact(item.totalVGV)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGV</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KpiTile = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-border/50 bg-muted/20 p-3 hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-lg font-bold text-foreground truncate" title={value}>
      {value}
    </p>
    {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
  </div>
);

export default LeadsAndTopBrokersPanel;
