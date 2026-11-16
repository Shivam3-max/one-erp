import { describe, it, expect } from "vitest";
import { quoteSubtotal, quoteTotals, type Quotation } from "@/lib/mock/quotations";

function makeQuote(partial: Partial<Quotation>): Quotation {
  return {
    lineItems: [],
    packing: 0,
    freight: 0,
    insurance: 0,
    gstPct: 18,
    ...partial,
  } as unknown as Quotation;
}

describe("quote totals", () => {
  it("subtotal sums non-optional line items", () => {
    const q = makeQuote({
      lineItems: [
        { desc: "A", qty: 2, unit: "no.", unitPrice: 100 },
        { desc: "B", qty: 1, unit: "no.", unitPrice: 50 },
      ],
    });
    expect(quoteSubtotal(q)).toBe(250);
  });

  it("excludes optional line items from the subtotal", () => {
    const q = makeQuote({
      lineItems: [
        { desc: "Base", qty: 1, unit: "no.", unitPrice: 1000 },
        { desc: "Add-on", qty: 1, unit: "no.", unitPrice: 500, optional: true },
      ],
    });
    expect(quoteSubtotal(q)).toBe(1000);
  });

  it("computes taxable, GST and grand total", () => {
    const q = makeQuote({
      lineItems: [{ desc: "Unit", qty: 1, unit: "no.", unitPrice: 10000 }],
      packing: 200,
      freight: 300,
      insurance: 100,
      gstPct: 18,
    });
    const t = quoteTotals(q);
    expect(t.subtotal).toBe(10000);
    expect(t.taxable).toBe(10600);
    expect(t.gst).toBe(1908); // round(10600 * 0.18)
    expect(t.grandTotal).toBe(12508);
  });
});
