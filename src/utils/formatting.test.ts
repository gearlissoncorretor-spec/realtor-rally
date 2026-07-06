import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  parseDateSafe,
  toLocalDate,
} from "./formatting";

describe("formatting", () => {
  it("formats Brazilian currency without abbreviation", () => {
    expect(formatCurrency(10000)).toMatch(/R\$\s?10\.000,00/);
    expect(formatCurrency(1234567.89)).toMatch(/R\$\s?1\.234\.567,89/);
  });

  it("formats numbers with pt-BR separators", () => {
    expect(formatNumber(1000)).toBe("1.000");
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("formats percentages with comma decimal", () => {
    expect(formatPercentage(12.5)).toBe("12,5%");
    expect(formatPercentage(0)).toBe("0,0%");
  });

  it("parses date strings without timezone shift", () => {
    const parsed = parseDateSafe("2026-03-01");
    expect(parsed).toEqual({ year: 2026, month: 3, day: 1 });
  });

  it("creates local Date at noon to avoid boundary issues", () => {
    const d = toLocalDate("2026-03-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(12);
  });
});
