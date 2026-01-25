import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveStatCardProps {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  value: string | number;
  label: string;
  sublabel?: string;
  className?: string;
}

export function ResponsiveStatCard({
  icon: Icon,
  iconColor,
  bgColor,
  value,
  label,
  sublabel,
  className,
}: ResponsiveStatCardProps) {
  // Calculate font size based on value length
  const getValueFontSize = (val: string | number) => {
    const strValue = String(val);
    const length = strValue.length;
    
    if (length <= 3) return "text-2xl sm:text-3xl";
    if (length <= 5) return "text-xl sm:text-2xl";
    if (length <= 8) return "text-lg sm:text-xl";
    if (length <= 12) return "text-base sm:text-lg";
    return "text-sm sm:text-base";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", bgColor)}>
            <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn(
              "font-bold leading-tight truncate",
              getValueFontSize(value)
            )}>
              {value}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {label}
            </p>
            {sublabel && (
              <p className="text-[10px] text-muted-foreground/70 truncate">
                {sublabel}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
