/**
 * Custom-family interpreter — turns a tenant-authored SCHEMA (pure JSON stored
 * on ProductFamily.schema) into a FamilyDef the same generic configurator engine
 * runs. This is what lets a tenant add cast-resin, switchgear or any product as
 * data: attributes drive a datasheet, BOM rules drive a real bill of material,
 * and the cost engine prices it against the active rate card — no code.
 */

import type { FamilyDef, Values, GroupDef, BomLine, Issue, DatasheetGroup } from "./model";

export type BomQtyMode = "fixed" | "perUnit" | "perMVA" | "perAttr";

export interface CustomBomRule {
  rateKey: string;    // material key from the rate card
  label: string;      // BOM line description
  category: string;   // BOM category tag
  unit: string;
  qtyMode: BomQtyMode;
  qty: number;        // fixed qty, or multiplier for perMVA / perAttr
  attrId?: string;    // attribute id for perAttr
}

export interface CustomSchema {
  groups: GroupDef[];      // attribute groups (AttrDef without visibleIf — plain JSON)
  bom: CustomBomRule[];    // bill-of-material rules
  mvaAttrId?: string;      // which numeric attribute represents rating (for perMVA)
}

export interface DbFamily {
  id: string;
  name: string;
  category: string;
  blurb: string;
  schema: CustomSchema | null;
}

export const EMPTY_SCHEMA: CustomSchema = {
  groups: [{ id: "spec", label: "Specification", attributes: [] }],
  bom: [],
};

/** A family is usable in the configurator only once it has attributes to configure. */
export function isBuildable(f: DbFamily): boolean {
  return !!f.schema && f.schema.groups.some((g) => g.attributes.length > 0);
}

/** Compile a tenant schema into the FamilyDef the generic engine consumes. */
export function customToFamilyDef(f: DbFamily): FamilyDef {
  const schema = f.schema ?? EMPTY_SCHEMA;
  return {
    id: f.id,
    name: f.name,
    category: f.category,
    blurb: f.blurb,
    groups: schema.groups,
    derive: (v: Values) => ({ mva: schema.mvaAttrId ? Number(v[schema.mvaAttrId]) || 0 : 0 }),
    validate: (v: Values) => {
      const issues: Issue[] = [];
      for (const g of schema.groups) {
        for (const a of g.attributes) {
          if (a.type === "number") {
            const n = Number(v[a.id]);
            if (a.min != null && n < a.min) issues.push({ level: "error", message: `${a.label} is below the minimum of ${a.min}${a.unit ? " " + a.unit : ""}.` });
            if (a.max != null && n > a.max) issues.push({ level: "error", message: `${a.label} is above the maximum of ${a.max}${a.unit ? " " + a.unit : ""}.` });
          }
        }
      }
      if (schema.bom.length === 0) issues.push({ level: "warn", message: "No BOM rules yet — add materials in the Family Studio to compute a cost." });
      return issues;
    },
    emitBom: (v: Values, d: Record<string, number>): BomLine[] =>
      schema.bom.map((r, i): BomLine => {
        let q = r.qty;
        if (r.qtyMode === "perMVA") q = r.qty * (d.mva || 0);
        else if (r.qtyMode === "perAttr" && r.attrId) q = r.qty * (Number(v[r.attrId]) || 0);
        // "fixed" and "perUnit" both use r.qty as the per-unit quantity
        return {
          key: `${f.id}-${i}`,
          category: r.category || "Material",
          description: r.label || r.rateKey,
          qty: Math.max(0, Math.round(q * 100) / 100),
          unit: r.unit || "unit",
          rateKey: r.rateKey,
        };
      }),
    datasheet: (v: Values): DatasheetGroup[] =>
      schema.groups.map((g): DatasheetGroup => ({
        group: g.label,
        rows: g.attributes.map((a) => ({
          label: a.label,
          value: `${v[a.id] ?? a.default}${a.unit ? " " + a.unit : ""}`,
        })),
      })),
  };
}

/** Human summary for saving a custom configuration to a project. */
export function customSummary(f: DbFamily, v: Values): string {
  const schema = f.schema ?? EMPTY_SCHEMA;
  const firstAttrs = schema.groups.flatMap((g) => g.attributes).slice(0, 2);
  const bits = firstAttrs.map((a) => `${v[a.id] ?? a.default}${a.unit ? " " + a.unit : ""}`);
  return [f.name, ...bits].filter(Boolean).join(" · ");
}
