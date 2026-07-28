import type { StageKey, StageMeta, DepartmentKey } from "./types";

/**
 * The canonical project lifecycle — the spine every project travels along.
 * Order and department mapping drive the Project Workspace rail and the
 * department-level analytics.
 */
export const LIFECYCLE: StageMeta[] = [
  { key: "lead", label: "Lead", department: "sales", order: 0 },
  { key: "qualification", label: "Qualification", department: "sales", order: 1 },
  { key: "rfq", label: "RFQ", department: "sales", order: 2 },
  { key: "engineering-review", label: "Engineering Review", department: "application-engineering", order: 3 },
  { key: "technical-design", label: "Technical Design", department: "design-engineering", order: 4 },
  { key: "estimation", label: "Estimation", department: "estimation", order: 5 },
  { key: "quotation", label: "Quotation", department: "commercial", order: 6 },
  { key: "negotiation", label: "Negotiation", department: "sales", order: 7 },
  { key: "purchase-order", label: "Purchase Order", department: "commercial", order: 8 },
  { key: "engineering-approval", label: "Engineering Approval", department: "design-engineering", order: 9 },
  { key: "procurement", label: "Procurement", department: "procurement", order: 10 },
  { key: "inventory-reservation", label: "Inventory Reservation", department: "procurement", order: 11 },
  { key: "manufacturing", label: "Manufacturing", department: "manufacturing", order: 12 },
  { key: "testing", label: "Testing", department: "quality", order: 13 },
  { key: "quality-inspection", label: "Quality Inspection", department: "quality", order: 14 },
  { key: "packing", label: "Packing", department: "manufacturing", order: 15 },
  { key: "dispatch", label: "Dispatch", department: "manufacturing", order: 16 },
  { key: "installation", label: "Installation", department: "manufacturing", order: 17 },
  { key: "commissioning", label: "Commissioning", department: "quality", order: 18 },
  { key: "warranty", label: "Warranty", department: "sales", order: 19 },
  { key: "amc", label: "AMC", department: "sales", order: 20 },
  { key: "repeat-business", label: "Repeat Business", department: "sales", order: 21 },
];

export const STAGE_META: Record<StageKey, StageMeta> = Object.fromEntries(
  LIFECYCLE.map((s) => [s.key, s])
) as Record<StageKey, StageMeta>;

export const DEPARTMENT_LABEL: Record<DepartmentKey, string> = {
  sales: "Sales",
  "application-engineering": "Application Engineering",
  "design-engineering": "Design Engineering",
  estimation: "Estimation",
  procurement: "Procurement",
  manufacturing: "Manufacturing",
  quality: "Quality & Testing",
  commercial: "Commercial",
  management: "Management",
};

export function stageIndex(key: StageKey): number {
  return STAGE_META[key]?.order ?? 0;
}
