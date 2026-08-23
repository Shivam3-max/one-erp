/**
 * Commercial configuration — the pricing knobs that differ by tenant, by
 * customer and by deal. Everything here is editable in Settings → Commercial;
 * a customer can override any of it (loss-capitalization, negotiated discount).
 */

export interface CommercialConfig {
  marginPct: number;       // default selling margin
  dealerPct: number;       // dealer / channel commission
  riskPct: number;         // risk buffer applied to landed cost
  freightPct: number;      // % of ex-works
  packingPct: number;      // % of ex-works
  insurancePct: number;    // % of ex-works
  gstPct: number;          // output GST
  paymentTerms: string;
  validityDays: number;
  warrantyMonths: number;
  noLoadCapRate: number;   // ₹ per Watt — no-load loss capitalization (utility tenders)
  loadCapRate: number;     // ₹ per Watt — load loss capitalization
}

export const DEFAULT_COMMERCIAL: CommercialConfig = {
  marginPct: 18, dealerPct: 2, riskPct: 3,
  freightPct: 2, packingPct: 1.2, insurancePct: 0.6, gstPct: 18,
  paymentTerms: "20% advance · 70% against dispatch · 10% after commissioning",
  validityDays: 60, warrantyMonths: 24,
  noLoadCapRate: 300, loadCapRate: 60,
};

/** Per-customer overrides — any subset of the commercial config, applied on top of tenant defaults. */
export type CustomerCommercial = Partial<CommercialConfig> & { discountPct?: number; notes?: string };

export function effectiveCommercial(base: CommercialConfig, override?: CustomerCommercial | null): CommercialConfig {
  if (!override) return base;
  const { discountPct: _d, notes: _n, ...rest } = override;
  return { ...base, ...rest };
}
