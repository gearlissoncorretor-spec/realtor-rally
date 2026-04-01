import { cn } from "@/lib/utils";
import { LucideIcon, SearchX, Inbox, FileX, Handshake, Users, Home, Target, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "search" | "negotiations" | "sales" | "brokers" | "goals" | "calendar";
  className?: string;
}

const variantConfig: Record<string, { icon: LucideIcon; gradient: string }> = {
  default: { icon: Inbox, gradient: "from-primary/20 to-primary/5" },
  search: { icon: SearchX, gradient: "from-muted/30 to-muted/10" },
  negotiations: { icon: Handshake, gradient: "from-amber-500/15 to-amber-500/5" },
  sales: { icon: Home, gradient: "from-emerald-500/15 to-emerald-500/5" },
  brokers: { icon: Users, gradient: "from-info/15 to-info/5" },
  goals: { icon: Target, gradient: "from-violet-500/15 to-violet-500/5" },
  calendar: { icon: CalendarX, gradient: "from-primary/15 to-primary/5" },
};

export function EmptyState({
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant] || variantConfig.default;
  const Icon = CustomIcon || config.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {/* Illustrated icon with gradient backdrop */}
      <div className={cn(
        "relative w-24 h-24 rounded-3xl flex items-center justify-center mb-6",
        `bg-gradient-to-br ${config.gradient}`
      )}>
        <Icon className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/20 animate-bounce-gentle" />
        <div className="absolute -bottom-2 -left-1 w-2 h-2 rounded-full bg-muted-foreground/15" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2 shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
