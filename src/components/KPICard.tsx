import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import AutoFitText from "@/components/AutoFitText";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  variant?: "default" | "hero";
  comparisonLabel?: string;
}

const KPICard = ({
  title,
  value,
  change,
  icon,
  trend = "neutral",
  className,
  variant = "default",
  comparisonLabel = "vs mês anterior",
}: KPICardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-emerald-600 dark:text-emerald-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getTrendBg = () => {
    switch (trend) {
      case "up":
        return "bg-emerald-50 dark:bg-emerald-500/10";
      case "down":
        return "bg-red-50 dark:bg-red-500/10";
      default:
        return "bg-blue-50 dark:bg-blue-500/10";
    }
  };

  const iconWrapBg =
    trend === "up"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
      : trend === "down"
      ? "bg-red-50 text-red-600 dark:bg-red-500/10"
      : "bg-primary/10 text-primary";

  const isHero = variant === "hero";

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
        "min-h-[120px] flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground truncate">
          {title}
        </p>
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            iconWrapBg
          )}
        >
          <span className="[&_svg]:w-[18px] [&_svg]:h-[18px]">{icon}</span>
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <AutoFitText
          max={isHero ? 42 : 36}
          min={20}
          className="font-display font-bold text-foreground tracking-tight tabular-nums"
        >
          {value}
        </AutoFitText>

        {(change !== undefined || comparisonLabel) && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {change !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                  getTrendBg(),
                  getTrendColor()
                )}
              >
                {trend === "up" && <TrendingUp className="w-3 h-3" />}
                {trend === "down" && <TrendingDown className="w-3 h-3" />}
                <span>
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              </span>
            )}
            {comparisonLabel && (
              <span className="text-[11px] text-muted-foreground">
                {comparisonLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

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
        return "text-emerald-600 dark:text-emerald-400";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendBg = () => {
    switch (trend) {
      case "up":
        return "bg-emerald-50 dark:bg-emerald-500/10";
      case "down":
        return "bg-red-50 dark:bg-destructive/10";
      default:
        return "bg-muted/50";
    }
  };

  const iconWrapBg =
    trend === "up"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
      : trend === "down"
      ? "bg-red-50 text-red-600 dark:bg-destructive/10"
      : "bg-primary/10 text-primary";

  if (variant === "hero") {
    return (
      <Card
        className={cn(
          "relative overflow-hidden p-6 group",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 relative">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {title}
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-[34px] lg:text-[40px] font-bold text-foreground tracking-tight leading-none tabular-nums">
                {value}
              </span>
              {change !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    getTrendBg(),
                    getTrendColor()
                  )}
                >
                  {trend === "up" && <TrendingUp className="w-3 h-3" />}
                  {trend === "down" && <TrendingDown className="w-3 h-3" />}
                  <span>{change > 0 ? "+" : ""}{change}%</span>
                </span>
              )}
            </div>
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconWrapBg)}>
            <span className="[&_svg]:w-5 [&_svg]:h-5">{icon}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden p-5 group", className)}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm font-medium text-muted-foreground truncate">
          {title}
        </p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconWrapBg)}>
          <span className="[&_svg]:w-4 [&_svg]:h-4">{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-display text-3xl font-bold text-foreground tracking-tight leading-none tabular-nums">
          {value}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
              getTrendBg(),
              getTrendColor()
            )}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            <span>{change > 0 ? "+" : ""}{change}%</span>
          </span>
        )}
      </div>
    </Card>
  );
};

export default KPICard;
