import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: number;
  onChange?: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = 0, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Formatar número para moeda brasileira
    const formatCurrency = (num: number): string => {
      if (isNaN(num) || num === 0) return "";
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // Converter string formatada para número
    const parseCurrency = (str: string): number => {
      if (!str) return 0;
      // Remove tudo exceto números, vírgulas e pontos
      let cleanStr = str.replace(/[^\d,.]/g, '');
      
      // Se tem vírgula e ponto, assume que ponto é separador de milhares
      if (cleanStr.includes(',') && cleanStr.includes('.')) {
        // Remove pontos (separadores de milhares) e mantém vírgula (decimal)
        cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
      } else if (cleanStr.includes(',')) {
        // Apenas vírgula - substitui por ponto
        cleanStr = cleanStr.replace(',', '.');
      }
      // Se apenas ponto, mantém como está
      
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Atualizar display value quando value prop muda
    React.useEffect(() => {
      setDisplayValue(formatCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Permitir apenas números, vírgulas, pontos e espaços
      const sanitizedValue = inputValue.replace(/[^\d,.]/g, '');
      
      setDisplayValue(sanitizedValue);
      
      // Converter para número e chamar onChange
      const numericValue = parseCurrency(sanitizedValue);
      onChange?.(numericValue);
    };

    const handleBlur = () => {
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
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };