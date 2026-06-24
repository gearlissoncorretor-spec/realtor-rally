/**
 * Centralized period filter logic for all dashboards.
 * Supports single month/year selection OR a custom date range (De/Até).
 * When dateRange is set, it OVERRIDES month/year selection.
 */
import { useState, useCallback } from "react";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface PeriodState {
  selectedMonth: number; // 0 = all
  selectedYear: number;  // 0 = all
  dateRange: DateRange;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const hasCustomRange = (r: DateRange | undefined | null): boolean =>
  !!(r && (r.from || r.to));

/**
 * Returns true when the given date matches the active period.
 * Priority: custom range > month/year selection.
 */
export const matchesPeriod = (
  rawDate: string | Date | null | undefined,
  period: { selectedMonth: number; selectedYear: number; dateRange?: DateRange }
): boolean => {
  if (!rawDate) return false;
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
  if (isNaN(date.getTime())) return false;

  // Custom range overrides
  if (hasCustomRange(period.dateRange)) {
    const from = period.dateRange?.from ? startOfDay(period.dateRange.from) : null;
    const to = period.dateRange?.to ? endOfDay(period.dateRange.to) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }

  const { selectedMonth, selectedYear } = period;
  if (selectedYear > 0 && date.getFullYear() !== selectedYear) return false;
  if (selectedMonth > 0 && date.getMonth() + 1 !== selectedMonth) return false;
  return true;
};

/** Convenience hook that bundles state + setters + matcher. */
export const usePeriodFilter = (
  defaultMonth = new Date().getMonth() + 1,
  defaultYear = new Date().getFullYear()
) => {
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  const matches = useCallback(
    (date: string | Date | null | undefined) =>
      matchesPeriod(date, { selectedMonth, selectedYear, dateRange }),
    [selectedMonth, selectedYear, dateRange]
  );

  const clearRange = useCallback(() => setDateRange({ from: null, to: null }), []);

  return {
    selectedMonth,
    selectedYear,
    dateRange,
    setSelectedMonth,
    setSelectedYear,
    setDateRange,
    clearRange,
    matches,
    isCustomRange: hasCustomRange(dateRange),
  };
};
