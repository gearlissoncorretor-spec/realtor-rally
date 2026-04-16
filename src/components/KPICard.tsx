import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  variant?: "default" | "hero";
}

const KPICard = ({ title, value, change, icon, trend = "neutral", className, variant = "default" }: KPICardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-emerald-500 dark:text-emerald-400";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendBg = () => {
    switch (trend) {
      case "up":
        return "bg-emerald-500/10";
      case "down":
        return "bg-destructive/10";
      default:
        return "bg-muted/50";
    }
  };

  if (variant === "hero") {
    return (
      <Card className={cn(
        "relative overflow-hidden p-6 bg-card border-primary/20 hover:border-primary/40 transition-all duration-500 group shadow-md hover:shadow-xl hover:-translate-y-1",
        className
      )}>
        {/* Gradient accent with glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-info opacity-80" />
        <div className="absolute top-0 left-0 right-0 h-4 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
        
        {/* Subtle animated background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex items-start justify-between gap-4 relative">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 opacity-80">
              {title}
            </p>
            <p className="text-3xl lg:text-4xl font-black text-foreground tracking-tighter truncate tabular-nums">
              {value}
            </p>
            {change !== undefined && (
              <div className={cn("inline-flex items-center gap-1.5 mt-4 px-2.5 py-1 rounded-full text-[13px] font-bold", getTrendBg(), getTrendColor())}>
                {trend === "up" && <TrendingUp className="w-4 h-4" />}
                {trend === "down" && <TrendingDown className="w-4 h-4" />}
                <span>{change > 0 ? "+" : ""}{change}%</span>
                <span className="text-[11px] font-normal text-muted-foreground/80 ml-1">vs anterior</span>
              </div>
            )}
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-primary/10">
            {icon}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden p-5 bg-card border-border/50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group",
      className
    )}>
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight truncate tabular-nums">
            {value}
          </p>
          {change !== undefined && (
            <div className={cn("inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[11px] font-bold", getTrendBg(), getTrendColor())}>
              {trend === "up" && <TrendingUp className="w-3 h-3" />}
              {trend === "down" && <TrendingDown className="w-3 h-3" />}
              <span>{change > 0 ? "+" : ""}{change}%</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-primary/[0.08] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default KPICard;