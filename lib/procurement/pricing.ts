/**
 * Deterministic RFQ pricing. Replaces the previous `Math.random()` so a given
 * requirement + vendor set always produces the same comparison — important for a
 * buyer-facing document that may be re-rendered or audited.
 */

export interface PricingVendor {
  id: string;
  rating: string; // "A" | "B"
  onTimePct: number;
}

/** Stable value in [0, 1) derived from a string (FNV-1a hash). */
export function stableSpread(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 to unsigned, then normalize
  return (h >>> 0) / 0xffffffff;
}

/**
 * Price a vendor's quote for a requirement.
 * - `index` is the vendor's rank in the comparison pool (0-based): later
 *   vendors are priced slightly higher so the first is usually most competitive.
 * - A stable per-vendor spread adds realistic variation without randomness.
 * - Higher on-time reliability and an A rating carry a small premium.
 */
export function vendorQuotePrice(baseValue: number, vendor: PricingVendor, index: number): number {
  const tier = index * 0.06;
  const spread = stableSpread(vendor.id) * 0.04;
  const reliability = Math.max(-0.02, Math.min(0.03, (vendor.onTimePct - 85) / 100));
  const ratingPremium = vendor.rating === "A" ? 0.01 : 0;
  const factor = 0.95 + tier + spread + reliability + ratingPremium;
  return Math.round(baseValue * factor);
}

/** Standard lead time (weeks) for a vendor at pool rank `index`. */
export function vendorLeadWeeks(index: number): number {
  return 5 + index * 2;
}
