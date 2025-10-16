import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "warning" | "danger";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", ...props }, ref) => {
  const getVariantClass = () => {
    const progressValue = value || 0;
    
    // Auto color based on value if variant is default
    if (variant === "default") {
      if (progressValue >= 90) return "bg-gradient-to-r from-green-500 to-green-600";
      if (progressValue >= 50) return "bg-gradient-to-r from-yellow-500 to-amber-500";
      return "bg-gradient-to-r from-red-500 to-rose-600";
    }
    
    switch (variant) {
      case "success":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "warning":
        return "bg-gradient-to-r from-yellow-500 to-amber-500";
      case "danger":
        return "bg-gradient-to-r from-red-500 to-rose-600";
      default:
        return "bg-primary";
    }
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary/30 shadow-inner", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all duration-500 ease-out shadow-sm", getVariantClass())}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
