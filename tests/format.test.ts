import { describe, it, expect } from "vitest";
import { money, fiscalQuarter } from "@/lib/format";

describe("money", () => {
  it("formats INR in crore and lakh", () => {
    expect(money({ amount: 37_000_000, currency: "INR" })).toBe("₹3.70 Cr");
    expect(money({ amount: 9_500_000, currency: "INR" })).toBe("₹95.00 L");
    expect(money({ amount: 1_00_00_000, currency: "INR" })).toBe("₹1.00 Cr");
  });

  it("formats small INR amounts with grouping", () => {
    expect(money({ amount: 5000, currency: "INR" })).toBe("₹5,000");
  });

  it("uses the right symbol for other currencies", () => {
    expect(money({ amount: 1500, currency: "USD" })).toBe("$1,500");
    expect(money({ amount: 1500, currency: "EUR" })).toBe("€1,500");
  });
});

describe("fiscalQuarter (Indian FY, starts April)", () => {
  it("maps months to the correct quarter", () => {
    expect(fiscalQuarter(new Date(2026, 3, 15))).toBe("Q1 FY27"); // April
    expect(fiscalQuarter(new Date(2026, 6, 15))).toBe("Q2 FY27"); // July
    expect(fiscalQuarter(new Date(2026, 10, 16))).toBe("Q3 FY27"); // November
    expect(fiscalQuarter(new Date(2027, 1, 15))).toBe("Q4 FY27"); // February
    expect(fiscalQuarter(new Date(2027, 2, 31))).toBe("Q4 FY27"); // March
  });

  it("rolls into the next fiscal year in April", () => {
    expect(fiscalQuarter(new Date(2027, 3, 1))).toBe("Q1 FY28");
  });
});
