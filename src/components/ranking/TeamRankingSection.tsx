import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact } from "@/utils/formatting";
import { TeamRanking } from "./types";

const TeamRankingSection = ({ teamRankings }: { teamRankings: TeamRanking[] }) => {
  if (teamRankings.length === 0) return null;

  const maxVGV = Math.max(...teamRankings.map(t => t.totalVGV), 1);

  return (
    <Card className="overflow-hidden border-border/50 mb-6">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground text-sm">Ranking por Equipe</h2>
        <Badge variant="secondary" className="ml-auto text-xs">{teamRankings.length} equipes</Badge>
      </div>
      <div className="p-3 space-y-2">
        {teamRankings.map((team) => {
          const barPct = (team.totalVGV / maxVGV) * 100;
          return (
            <div
              key={team.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                team.position === 1
                  ? "bg-warning/5 border-warning/20"
                  : "bg-card/50 border-border/50 hover:border-primary/20"
              )}
            >
              {team.position === 1 ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 shrink-0">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">#{team.position}</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{team.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{team.totalSales} vendas</span>
                  <span>{team.brokerCount} corretores</span>
                </div>
                <div className="mt-1.5">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        team.position === 1 ? "bg-warning" : "bg-primary/60"
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className={cn(
                  "font-bold text-sm",
                  team.position === 1 ? "text-warning" : "text-foreground"
                )}>
                  {formatCurrencyCompact(team.totalVGV)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TeamRankingSection;
