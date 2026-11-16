import { describe, it, expect } from "vitest";
import { stableSpread, vendorQuotePrice, vendorLeadWeeks, type PricingVendor } from "@/lib/procurement/pricing";

const vA: PricingVendor = { id: "V-100001", rating: "A", onTimePct: 92 };
const vB: PricingVendor = { id: "V-100002", rating: "B", onTimePct: 80 };

describe("stableSpread", () => {
  it("is deterministic and in [0,1)", () => {
    const s = stableSpread("V-100001");
    expect(s).toBe(stableSpread("V-100001"));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThan(1);
  });

  it("differs for different seeds", () => {
    expect(stableSpread("V-100001")).not.toBe(stableSpread("V-100002"));
  });
});

describe("vendorQuotePrice", () => {
  it("is deterministic (no randomness)", () => {
    expect(vendorQuotePrice(1_000_000, vA, 0)).toBe(vendorQuotePrice(1_000_000, vA, 0));
  });

  it("prices later pool positions higher", () => {
    expect(vendorQuotePrice(1_000_000, vA, 1)).toBeGreaterThan(vendorQuotePrice(1_000_000, vA, 0));
  });

  it("stays within a sane band around the base value", () => {
    const p = vendorQuotePrice(1_000_000, vA, 0);
    expect(p).toBeGreaterThan(900_000);
    expect(p).toBeLessThan(1_100_000);
  });

  it("lead time grows with pool position", () => {
    expect(vendorLeadWeeks(0)).toBe(5);
    expect(vendorLeadWeeks(2)).toBe(9);
  });
});
