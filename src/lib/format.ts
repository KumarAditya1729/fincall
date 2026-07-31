const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | null | undefined): string {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatPercent(value: number | null | undefined): string {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Business day boundaries follow the lender's operating timezone (IST), not the
 * device clock. Using the browser's local day made "today's calls" and PTP-due
 * buckets disagree with the database, which computes them in Asia/Kolkata.
 */
export const BUSINESS_TIMEZONE = "Asia/Kolkata";

const businessDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Current business date as `YYYY-MM-DD` in the lender's timezone. */
export function todayISO(): string {
  return businessDayFormatter.format(new Date());
}

/** UTC instant at which the current business day started. */
export function startOfTodayISO(): string {
  // IST is a fixed +05:30 offset (no daylight saving), so this is exact.
  return new Date(`${todayISO()}T00:00:00+05:30`).toISOString();
}
