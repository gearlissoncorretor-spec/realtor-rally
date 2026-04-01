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
        "relative overflow-hidden p-6 bg-card border-primary/20 hover:border-primary/40 transition-all duration-300 group shadow-md hover:shadow-lg hover:-translate-y-0.5",
        className
      )}>
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-info opacity-80" />
        {/* Subtle glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="flex items-start justify-between gap-4 relative">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              {title}
            </p>
            <p className="text-3xl lg:text-4xl font-black text-foreground tracking-tight truncate tabular-nums">
              {value}
            </p>
            {change !== undefined && (
              <div className={cn("inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-sm font-semibold", getTrendBg(), getTrendColor())}>
                {trend === "up" && <TrendingUp className="w-4 h-4" />}
                {trend === "down" && <TrendingDown className="w-4 h-4" />}
                <span>{change > 0 ? "+" : ""}{change}%</span>
                <span className="text-xs font-normal text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            {icon}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden p-5 bg-card border-border/50 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group",
      className
    )}>
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight truncate tabular-nums">
            {value}
          </p>
          {change !== undefined && (
            <div className={cn("inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-md text-xs font-medium", getTrendBg(), getTrendColor())}>
              {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
              <span>{change > 0 ? "+" : ""}{change}%</span>
            </div>
          )}
        </div>
        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default KPICard;
