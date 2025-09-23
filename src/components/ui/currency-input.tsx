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

    // Formatar número para moeda brasileira (apenas números, sem símbolo, pois o símbolo é visual)
    const formatCurrency = (num: number): string => {
      if (isNaN(num) || num === 0) return ""; // mantém vazio quando 0 para não "sugerir" 0
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Converter string formatada para número
    const parseCurrency = (str: string): number => {
      if (!str) return 0;
      let cleanStr = str.replace(/[^\d,.]/g, "");

      // Se tem vírgula e ponto, assume ponto como separador de milhar e vírgula como decimal
      if (cleanStr.includes(",") && cleanStr.includes(".")) {
        cleanStr = cleanStr.replace(/\./g, "").replace(",", ".");
      } else if (cleanStr.includes(",")) {
        // Apenas vírgula
        cleanStr = cleanStr.replace(",", ".");
      }
      // Apenas ponto: mantém

      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Atualizar displayValue quando o value externo mudar, mas não durante a digitação
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Permitir apenas números, vírgulas e pontos
      const sanitizedValue = inputValue.replace(/[^\d,.]/g, "");
      setDisplayValue(sanitizedValue);

      // Converter para número e propagar
      const numericValue = parseCurrency(sanitizedValue);
      onChange?.(numericValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Reformatar o valor ao sair do campo
      const numericValue = parseCurrency(displayValue);
      const formatted = formatCurrency(numericValue);
      setDisplayValue(formatted);
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
