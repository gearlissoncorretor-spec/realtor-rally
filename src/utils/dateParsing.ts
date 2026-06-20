// Parse "YYYY-MM-DD" or ISO timestamp safely as LOCAL date (avoids UTC shift).
// JS quirk: new Date("2026-06-01") is parsed as UTC midnight, so .getMonth() in
// BRT (UTC-3) returns May. This helper returns local Y/M/D from the string.
export const parseLocalDateParts = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const datePart = dateStr.substring(0, 10);
  const [y, m, d] = datePart.split('-').map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
};

// Returns a Date constructed in local time (no TZ shift).
export const parseLocalDate = (dateStr?: string | null): Date | null => {
  const parts = parseLocalDateParts(dateStr);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day);
};
