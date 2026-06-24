import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/utils/periodFilter';
import { hasCustomRange } from '@/utils/periodFilter';

interface PeriodFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  /** Optional: enable custom date range mode (De/Até). */
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  dateRange,
  onDateRangeChange,
}) => {
  const months = [
    { value: 0, label: 'Todos os meses' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [
    { value: 0, label: 'Todos os anos' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: (currentYear - i).toString(),
    })),
  ];

  const rangeEnabled = !!onDateRangeChange;
  const customActive = hasCustomRange(dateRange);

  const fmt = (d: Date | null | undefined) =>
    d ? format(d, "dd 'de' MMM yyyy", { locale: ptBR }) : '—';

  const rangeLabel = customActive
    ? `${fmt(dateRange?.from)} → ${fmt(dateRange?.to)}`
    : 'Período personalizado';

  return (
    <Card className="p-4 bg-gradient-card border-border mb-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Filtros de Período:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => onMonthChange(parseInt(value))}
              disabled={customActive}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => onYearChange(parseInt(value))}
            disabled={customActive}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value.toString()}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {rangeEnabled && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={customActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn('gap-2 h-9', customActive && 'shadow-sm')}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-xs">{rangeLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange?.from ?? undefined,
                      to: dateRange?.to ?? undefined,
                    }}
                    onSelect={(r) =>
                      onDateRangeChange?.({
                        from: r?.from ?? null,
                        to: r?.to ?? null,
                      })
                    }
                    numberOfMonths={2}
                    locale={ptBR}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
              {customActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => onDateRangeChange?.({ from: null, to: null })}
                  title="Limpar intervalo"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PeriodFilter;
