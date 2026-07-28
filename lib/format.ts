import type { Money, ISODate } from "./types";

const SYMBOL: Record<string, string> = { INR: "₹", USD: "$", EUR: "€" };

/** Format money the Indian way: lakh/crore for INR, compact otherwise. */
export function money(m: Money, opts: { compact?: boolean } = {}): string {
  const sym = SYMBOL[m.currency] ?? "";
  const n = m.amount;
  if (m.currency === "INR" && opts.compact !== false) {
    if (n >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(2)} Cr`;
    if (n >= 1_00_000) return `${sym}${(n / 1_00_000).toFixed(2)} L`;
  }
  if (opts.compact && n >= 1000) {
    if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
    return `${sym}${(n / 1000).toFixed(1)}K`;
  }
  return `${sym}${n.toLocaleString("en-IN")}`;
}

export function shortDate(d?: ISODate): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function relDate(d?: ISODate): string {
  if (!d) return "—";
  const then = new Date(d).getTime();
  const now = Date.now();
  const days = Math.round((now - then) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days > 0 && days < 30) return `${days}d ago`;
  if (days < 0 && days > -30) return `in ${Math.abs(days)}d`;
  return shortDate(d);
}

export function initialsOf(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
