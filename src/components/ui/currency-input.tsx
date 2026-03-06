import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: number;
  onChange?: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = 0, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    const formatCurrency = (num: number): string => {
      if (isNaN(num) || num === 0) return "";
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    /**
     * Smart currency parser that handles:
     * - "500000" → 500000 (plain number, auto-formatted on blur)
     * - "500.000" → 500000 (Brazilian thousands separator)
     * - "500.000,00" → 500000 (full Brazilian format)
     * - "1.500.000,50" → 1500000.50
     * - "500,50" → 500.50 (comma as decimal)
     * - "500.50" → 500.50 (dot as decimal when no comma and ≤2 digits after dot)
     * - "1500,5" → 1500.50
     */
    const parseCurrency = (str: string): number => {
      if (!str) return 0;
      const cleanStr = str.replace(/[^\d,.]/g, "");
      if (!cleanStr) return 0;

      let normalized: string;

      const hasComma = cleanStr.includes(",");
      const hasDot = cleanStr.includes(".");

      if (hasComma && hasDot) {
        // Both separators: dot is thousands, comma is decimal (Brazilian standard)
        normalized = cleanStr.replace(/\./g, "").replace(",", ".");
      } else if (hasComma) {
        // Only comma: treat as decimal separator
        normalized = cleanStr.replace(",", ".");
      } else if (hasDot) {
        // Only dot: check context
        const parts = cleanStr.split(".");
        const afterDot = parts[parts.length - 1];
        
        if (parts.length > 2) {
          // Multiple dots like "1.500.000" → thousands separators
          normalized = cleanStr.replace(/\./g, "");
        } else if (afterDot.length === 3 && parts[0].length <= 3) {
          // "500.000" → likely thousands separator (3 digits after dot)
          normalized = cleanStr.replace(/\./g, "");
        } else if (afterDot.length <= 2) {
          // "500.50" or "500.5" → decimal
          normalized = cleanStr;
        } else {
          // "5000.000" with >3 chars before dot → ambiguous, treat as thousands
          normalized = cleanStr.replace(/\./g, "");
        }
      } else {
        // No separators: plain number
        normalized = cleanStr;
      }

      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };

    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const sanitizedValue = inputValue.replace(/[^\d,.]/g, "");
      setDisplayValue(sanitizedValue);

      const numericValue = parseCurrency(sanitizedValue);
      onChange?.(numericValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numericValue = parseCurrency(displayValue);
      onChange?.(numericValue);
      setDisplayValue(formatCurrency(numericValue));
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9.,]*"
          autoComplete="off"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          value={displayValue}
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
