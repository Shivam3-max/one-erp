import type { QuoteBlockType } from "../types";
import { PROJECTS, projectById } from "./projects";
import { stageIndex } from "../lifecycle";

export interface QuoteLineItem {
  desc: string;
  qty: number;
  unit: string;
  unitPrice: number;
  optional?: boolean;
}
export interface QuoteRevisionRec {
  rev: number;
  date: string;
  authorId: string;
  change: string;
}
export interface QuoteApproval {
  role: string;
  userId: string;
  status: "approved" | "pending";
  date?: string;
}
export interface QuoteBlock {
  type: QuoteBlockType;
  title: string;
  included: boolean;
}
export interface Quotation {
  id: string;
  projectId: string;
  customerId: string;
  revision: number;
  status: "draft" | "issued" | "won" | "lost" | "revised";
  validityDays: number;
  updatedAt: string;
  ownerId: string;
  product: string;
  lineItems: QuoteLineItem[];
  packing: number;
  freight: number;
  insurance: number;
  gstPct: number;
  paymentTerms: string;
  deliveryWeeks: number;
  scope: string[];
  exclusions: string[];
  terms: { label: string; value: string }[];
  blocks: QuoteBlock[];
  revisions: QuoteRevisionRec[];
  approvals: QuoteApproval[];
}

const ALL_BLOCKS: { type: QuoteBlockType; title: string }[] = [
  { type: "cover-letter", title: "Cover Letter" },
  { type: "commercial-offer", title: "Commercial Offer" },
  { type: "technical-offer", title: "Technical Offer" },
  { type: "compliance-matrix", title: "Compliance Matrix" },
  { type: "scope", title: "Scope of Supply" },
  { type: "exclusions", title: "Exclusions" },
  { type: "drawings", title: "Drawings & Datasheets" },
  { type: "commercial-terms", title: "Commercial Terms" },
  { type: "revision-history", title: "Revision History" },
];

const parseQty = (product: string): number => {
  const m = product.match(/^(\d+)\s*[×x]/);
  return m ? Number(m[1]) : 1;
};

function build(projectId: string): Quotation | null {
  const p = projectById(projectId);
  if (!p) return null;
  const qty = parseQty(p.productSummary);
  const exWorksUnit = Math.round((p.value.amount * 0.86) / qty);
  const num = projectId.split("-").pop();

  const lineItems: QuoteLineItem[] = [
    { desc: p.productSummary, qty, unit: "no.", unitPrice: exWorksUnit },
  ];
  // hero-specific optional lines that tie back to compliance deviations
  if (projectId === "PRJ-2026-0142") {
    lineItems.push({ desc: "60-month extended warranty (per unit)", qty, unit: "no.", unitPrice: Math.round(exWorksUnit * 0.035), optional: true });
    lineItems.push({ desc: "Polymer HV bushing upgrade (per set)", qty, unit: "set", unitPrice: 27000, optional: true });
    lineItems.push({ desc: "Mandatory spares kit", qty: 1, unit: "lot", unitPrice: 185000 });
  }

  const subtotal = lineItems.filter((l) => !l.optional).reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const packing = Math.round(subtotal * 0.012);
  const freight = Math.round(subtotal * 0.02);
  const insurance = Math.round(subtotal * 0.006);

  const isHero = projectId === "PRJ-2026-0142";

  return {
    id: `CAN/Q/2026/${num}`,
    projectId,
    customerId: p.customerId,
    revision: isHero ? 3 : 1,
    status: stageIndex(p.currentStage) > stageIndex("quotation") ? "won" : "issued",
    validityDays: 60,
    updatedAt: p.createdAt,
    ownerId: "U-05",
    product: p.productSummary,
    lineItems,
    packing,
    freight,
    insurance,
    gstPct: 18,
    paymentTerms: "20% advance · 70% against dispatch · 10% after commissioning",
    deliveryWeeks: 20,
    scope: ["Design, manufacture & routine testing", "Supply ex-works / FOR site", "Installation supervision", "Commissioning assistance", "Test certificates & O&M documentation", "Warranty support"],
    exclusions: ["Civil foundations & grouting", "HV/LV cabling & terminations", "Unloading & storage at site", "Statutory & utility approvals", "Any taxes/duties beyond those stated"],
    terms: [
      { label: "Delivery", value: "20 weeks from approved drawings & advance" },
      { label: "Payment", value: "20 / 70 / 10 (advance / dispatch / commissioning)" },
      { label: "Validity", value: "60 days from date of offer" },
      { label: "Liquidated damages", value: "0.5% per week, max 5% of order value" },
      { label: "Warranty", value: isHero ? "24 months standard (60 months optional)" : "24 months from commissioning" },
      { label: "Price basis", value: "Firm, ex-works; taxes extra at actuals" },
      { label: "Jurisdiction", value: "Courts at Nagpur, subject to arbitration" },
    ],
    blocks: ALL_BLOCKS.map((b) => ({ ...b, included: true })),
    revisions: isHero
      ? [
          { rev: 1, date: "2026-04-14", authorId: "U-05", change: "First offer issued." },
          { rev: 2, date: "2026-04-22", authorId: "U-05", change: "Payment terms revised to 20/70/10." },
          { rev: 3, date: "2026-05-02", authorId: "U-05", change: "Price firmed after negotiation; validity 60 days." },
        ]
      : [{ rev: 1, date: p.createdAt, authorId: "U-05", change: "Offer prepared from configuration & estimate." }],
    approvals: [
      { role: "Sales", userId: "U-01", status: "approved", date: "2026-04-13" },
      { role: "Engineering", userId: "U-03", status: "approved", date: "2026-04-13" },
      { role: "Commercial", userId: "U-05", status: "approved", date: "2026-04-14" },
      { role: "Director", userId: "U-09", status: isHero ? "approved" : "pending", date: isHero ? "2026-04-14" : undefined },
    ],
  };
}

const QUOTABLE = PROJECTS.filter((p) => stageIndex(p.currentStage) >= stageIndex("quotation"));

export const QUOTATIONS: Quotation[] = QUOTABLE.map((p) => build(p.id)!).filter(Boolean);

export function quotationByProject(projectId: string): Quotation | undefined {
  return QUOTATIONS.find((q) => q.projectId === projectId);
}
export function quotationById(id: string): Quotation | undefined {
  return QUOTATIONS.find((q) => q.id === id);
}

/** grand-total helpers */
export function quoteSubtotal(q: Quotation): number {
  return q.lineItems.filter((l) => !l.optional).reduce((s, l) => s + l.qty * l.unitPrice, 0);
}
export function quoteTotals(q: Quotation) {
  const subtotal = quoteSubtotal(q);
  const taxable = subtotal + q.packing + q.freight + q.insurance;
  const gst = Math.round(taxable * (q.gstPct / 100));
  return { subtotal, taxable, gst, grandTotal: taxable + gst };
}
