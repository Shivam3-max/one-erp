/**
 * Estimation benchmarks — delivered projects with ESTIMATED vs ACTUAL landed cost.
 * This is what lets the estimator "learn from actuals": a new estimate is checked
 * against the real outcomes of similar delivered units. Excel can't do this.
 */

export interface Benchmark {
  id: string;
  product: string;
  mva: number;
  voltageClass: string; // "33/11"
  deliveredAt: string;
  qty: number;
  estPerUnit: number; // INR — what we quoted
  actualPerUnit: number; // INR — what it actually cost to build & deliver
}

export const BENCHMARKS: Benchmark[] = [
  { id: "PRJ-2024-0088", product: "5 MVA 33/11 kV ONAN", mva: 5, voltageClass: "33/11", deliveredAt: "2025-11-20", qty: 2, estPerUnit: 19_500_000, actualPerUnit: 20_450_000 },
  { id: "PRJ-2025-0031", product: "5 MVA 33/11 kV ONAN", mva: 5, voltageClass: "33/11", deliveredAt: "2026-02-14", qty: 3, estPerUnit: 19_800_000, actualPerUnit: 21_100_000 },
  { id: "PRJ-2024-0102", product: "5 MVA 33/11 kV ONAN", mva: 5, voltageClass: "33/11", deliveredAt: "2025-08-05", qty: 2, estPerUnit: 18_900_000, actualPerUnit: 19_700_000 },
  { id: "PRJ-2025-0067", product: "10 MVA 66/11 kV ONAF", mva: 10, voltageClass: "66/11", deliveredAt: "2026-04-30", qty: 1, estPerUnit: 34_200_000, actualPerUnit: 35_950_000 },
  { id: "PRJ-2024-0075", product: "20 MVA 132/33 kV", mva: 20, voltageClass: "132/33", deliveredAt: "2025-06-18", qty: 1, estPerUnit: 61_500_000, actualPerUnit: 66_200_000 },
];

/** Most similar delivered units: same voltage class first, then nearest rating. */
export function similarBenchmarks(mva: number, voltageClass: string): Benchmark[] {
  return [...BENCHMARKS]
    .sort((a, b) => {
      const av = a.voltageClass === voltageClass ? 0 : 1;
      const bv = b.voltageClass === voltageClass ? 0 : 1;
      if (av !== bv) return av - bv;
      return Math.abs(a.mva - mva) - Math.abs(b.mva - mva);
    })
    .slice(0, 3);
}

export const overrunOf = (b: Benchmark) => (b.actualPerUnit - b.estPerUnit) / b.estPerUnit;

export interface Commodity {
  key: string;
  label: string;
  cardRate: number; // rate card (used in the estimate)
  spotRate: number; // today's market
  unit: string;
}

/** Live commodity watch vs the rate card baked into the estimate. */
export const COMMODITIES: Commodity[] = [
  { key: "copper", label: "Copper", cardRate: 935, spotRate: 972, unit: "kg" },
  { key: "crgo", label: "CRGO lamination", cardRate: 345, spotRate: 358, unit: "kg" },
  { key: "steel", label: "MS / tank steel", cardRate: 92, spotRate: 90, unit: "kg" },
  { key: "oil_mineral", label: "Mineral oil", cardRate: 145, spotRate: 151, unit: "L" },
];

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}
