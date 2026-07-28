/**
 * CONFIGURATOR ENGINE — the "compiler"
 * ------------------------------------
 * A product is defined as a Family (data): grouped attributes + a few pure
 * functions (derive / validate / emitBom / datasheet). One generic engine turns
 * any Family + chosen values into: derived engineering values, validation issues,
 * a multi-level BOM, a live cost sheet, and a datasheet. Spec in → BOM + cost + doc out.
 *
 * In Phase 2 the attribute schema lives in the DB (per tenant); the emit logic is a
 * rule interpreter. Here it's typed TS so the demo actually computes.
 */

export type Values = Record<string, string | number | boolean>;
export type AttrType = "enum" | "number" | "boolean";

export interface AttrOption {
  value: string;
  label: string;
}

export interface AttrDef {
  id: string;
  label: string;
  type: AttrType;
  unit?: string;
  options?: AttrOption[];
  default: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
  /** conditional visibility based on other values */
  visibleIf?: (v: Values) => boolean;
  /** this attribute drives BOM / cost, not just the datasheet */
  drivesBom?: boolean;
}

export interface GroupDef {
  id: string;
  label: string;
  attributes: AttrDef[];
}

export type IssueLevel = "error" | "warn" | "note";
export interface Issue {
  level: IssueLevel;
  message: string;
}

export interface BomLine {
  key: string;
  category: string;
  description: string;
  qty: number;
  unit: string;
  rateKey: string;
}

export interface DatasheetGroup {
  group: string;
  rows: { label: string; value: string }[];
}

export interface FamilyDef {
  id: string;
  name: string;
  category: string;
  blurb: string;
  groups: GroupDef[];
  derive: (v: Values) => Record<string, number>;
  validate: (v: Values, d: Record<string, number>) => Issue[];
  emitBom: (v: Values, d: Record<string, number>) => BomLine[];
  datasheet: (v: Values, d: Record<string, number>) => DatasheetGroup[];
}

/* ---------------- Rate card (temporal — dated) ---------------- */

export const RATE_CARD_DATE = "2026-07-01";

export interface Rate {
  label: string;
  rate: number;
  unit: string;
}

export const RATES: Record<string, Rate> = {
  copper: { label: "Copper (electrolytic)", rate: 935, unit: "kg" },
  aluminium: { label: "Aluminium", rate: 315, unit: "kg" },
  crgo: { label: "CRGO lamination", rate: 345, unit: "kg" },
  amorphous: { label: "Amorphous core", rate: 560, unit: "kg" },
  steel: { label: "MS / tank steel", rate: 92, unit: "kg" },
  oil_mineral: { label: "Mineral oil (IS 335)", rate: 145, unit: "L" },
  oil_ester: { label: "Ester fluid", rate: 430, unit: "L" },
  bushing_porcelain: { label: "Porcelain bushing", rate: 4500, unit: "no." },
  bushing_polymer: { label: "Polymer bushing", rate: 7200, unit: "no." },
  oltc: { label: "On-load tap changer", rate: 985000, unit: "unit" },
  octc: { label: "Off-circuit tap changer", rate: 58000, unit: "unit" },
  radiator: { label: "Radiator panel", rate: 3900, unit: "panel" },
  fan: { label: "Cooling fan", rate: 12500, unit: "no." },
  conservator: { label: "Conservator w/ silica breather", rate: 46000, unit: "unit" },
  buchholz: { label: "Buchholz relay", rate: 18500, unit: "unit" },
  otiwti: { label: "OTI + WTI", rate: 24000, unit: "set" },
  prv: { label: "Pressure relief valve", rate: 8800, unit: "unit" },
  mog: { label: "Magnetic oil gauge", rate: 6800, unit: "unit" },
  rtcc: { label: "RTCC + remote monitoring", rate: 195000, unit: "unit" },
  paint: { label: "Paint (epoxy/PU)", rate: 520, unit: "kg" },
  hardware: { label: "Hardware & accessories", rate: 16000, unit: "MVA-set" },
};

export function rateOf(key: string): number {
  return RATES[key]?.rate ?? 0;
}

/* ---------------- Cost engine (generic, from BOM) ---------------- */

export interface CostLine {
  label: string;
  amount: number;
  kind: "material" | "labour" | "overhead" | "testing" | "logistics" | "margin";
}

export interface CostSheet {
  materialLines: { label: string; amount: number }[];
  material: number;
  labour: number;
  overhead: number;
  testing: number;
  logistics: number;
  perUnit: number;
  oneTime: number;
  quantity: number;
  estimatedCost: number;
  marginPct: number;
  sellingPrice: number;
  contribution: number;
}

export function computeCost(bom: BomLine[], v: Values, marginPct: number): CostSheet {
  const materialLines = bom.map((l) => ({
    label: l.description,
    amount: l.qty * rateOf(l.rateKey),
  }));
  const material = materialLines.reduce((s, l) => s + l.amount, 0);
  const labour = material * 0.14;
  const overhead = (material + labour) * 0.09;
  const routineTesting = 45000;
  const logistics = material * 0.06; // packing + freight + insurance
  const perUnit = material + labour + overhead + routineTesting + logistics;

  const oneTime =
    (v.typeTest ? 180000 : 0) +
    (v.impulseTest ? 120000 : 0) +
    (v.scTest ? 260000 : 0);

  const quantity = Math.max(1, Number(v.quantity) || 1);
  const estimatedCost = perUnit * quantity + oneTime;
  const sellingPrice = estimatedCost / (1 - marginPct / 100);
  const contribution = sellingPrice - estimatedCost;

  return {
    materialLines,
    material,
    labour,
    overhead,
    testing: routineTesting * quantity + oneTime,
    logistics,
    perUnit,
    oneTime,
    quantity,
    estimatedCost,
    marginPct,
    sellingPrice,
    contribution,
  };
}

/* ---------------- Helpers ---------------- */

export function attrCount(f: FamilyDef): number {
  return f.groups.reduce((s, g) => s + g.attributes.length, 0);
}

export function initValues(f: FamilyDef): Values {
  const v: Values = {};
  for (const g of f.groups) for (const a of g.attributes) v[a.id] = a.default;
  return v;
}

export function num(v: Values, id: string): number {
  return Number(v[id]) || 0;
}
