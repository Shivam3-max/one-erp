import { describe, it, expect } from "vitest";
import { effectiveCommercial, DEFAULT_COMMERCIAL, type CustomerCommercial } from "@/lib/commercial";

describe("effectiveCommercial", () => {
  it("returns the base config when there is no override", () => {
    expect(effectiveCommercial(DEFAULT_COMMERCIAL)).toEqual(DEFAULT_COMMERCIAL);
    expect(effectiveCommercial(DEFAULT_COMMERCIAL, null)).toEqual(DEFAULT_COMMERCIAL);
  });

  it("applies a partial override on top of the base", () => {
    const override: CustomerCommercial = { marginPct: 25, gstPct: 12 };
    const result = effectiveCommercial(DEFAULT_COMMERCIAL, override);
    expect(result.marginPct).toBe(25);
    expect(result.gstPct).toBe(12);
    // untouched fields keep the base value
    expect(result.freightPct).toBe(DEFAULT_COMMERCIAL.freightPct);
    expect(result.paymentTerms).toBe(DEFAULT_COMMERCIAL.paymentTerms);
  });

  it("ignores customer-only keys (discountPct, notes) when merging config", () => {
    const override: CustomerCommercial = { discountPct: 5, notes: "VIP", marginPct: 20 };
    const result = effectiveCommercial(DEFAULT_COMMERCIAL, override);
    expect(result.marginPct).toBe(20);
    expect((result as unknown as Record<string, unknown>).discountPct).toBeUndefined();
    expect((result as unknown as Record<string, unknown>).notes).toBeUndefined();
  });

  it("does not mutate the base object", () => {
    const base = { ...DEFAULT_COMMERCIAL };
    effectiveCommercial(base, { marginPct: 99 });
    expect(base.marginPct).toBe(DEFAULT_COMMERCIAL.marginPct);
  });
});
