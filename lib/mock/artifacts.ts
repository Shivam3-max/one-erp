import type { Artifact, ArtifactType, Project, StageKey, ArtifactStatus } from "../types";
import { TENANT } from "./org";

const projNum = (projectId: string) => projectId.split("-").pop() ?? "0000";

/* ---- Hero project: hand-authored traceability graph ---- */

const HERO = "PRJ-2026-0142";

export const HERO_ARTIFACTS: Artifact[] = [
  {
    id: "TND-0142", tenantId: TENANT.id, projectId: HERO, type: "tender", title: "MSEDCL Tender NIT-2026/Nagpur/033", status: "issued", stage: "rfq", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-03-04", authorId: "U-01", changeSummary: "Tender received & logged (147 pages)." }],
    links: [], ownerId: "U-01", updatedAt: "2026-03-04", meta: { pages: 147, "closing date": "2026-03-28" },
  },
  {
    id: "RFQ-0142", tenantId: TENANT.id, projectId: HERO, type: "rfq", title: "RFQ — 2 × 5 MVA 33/11 kV Transformers", status: "approved", stage: "rfq", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-03-06", authorId: "U-02", changeSummary: "Extracted scope & technical schedule from tender." }],
    links: [{ toArtifactId: "TND-0142", type: "derives-from", atRevision: 1 }], ownerId: "U-02", updatedAt: "2026-03-06",
  },
  {
    id: "REQ-0142", tenantId: TENANT.id, projectId: HERO, type: "requirement", title: "Requirement Analysis & Deviation Notes", status: "approved", stage: "engineering-review", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-03-11", authorId: "U-02", changeSummary: "63 technical requirements captured; 4 deviations raised." }],
    links: [{ toArtifactId: "RFQ-0142", type: "derives-from", atRevision: 1 }], ownerId: "U-02", updatedAt: "2026-03-11", meta: { requirements: 63, deviations: 4 },
  },
  {
    id: "CMX-0142", tenantId: TENANT.id, projectId: HERO, type: "compliance-matrix", title: "Compliance Matrix (IS 2026 / IS 1180)", status: "approved", stage: "engineering-review", currentRevision: 2,
    revisions: [
      { rev: 1, createdAt: "2026-03-13", authorId: "U-02", changeSummary: "Initial comply/deviate mapping." },
      { rev: 2, createdAt: "2026-03-18", authorId: "U-02", changeSummary: "Losses clause reconciled with customer; 2 deviations closed." },
    ],
    links: [{ toArtifactId: "REQ-0142", type: "satisfies", atRevision: 1 }], ownerId: "U-02", updatedAt: "2026-03-18",
  },
  {
    id: "CFG-0142", tenantId: TENANT.id, projectId: HERO, type: "configuration", title: "Product Configuration — 5 MVA 33/11 kV", status: "approved", stage: "technical-design", currentRevision: 2,
    revisions: [
      { rev: 1, createdAt: "2026-03-20", authorId: "U-03", changeSummary: "Configured from Power Transformer family (312 fields)." },
      { rev: 2, createdAt: "2026-03-27", authorId: "U-03", changeSummary: "OLTC changed to on-load (± 10 % / 17 steps)." },
    ],
    links: [{ toArtifactId: "REQ-0142", type: "satisfies", atRevision: 1 }], ownerId: "U-03", updatedAt: "2026-03-27", meta: { fields: 312 },
  },
  {
    id: "GA-0142", tenantId: TENANT.id, projectId: HERO, type: "ga-drawing", title: "General Arrangement Drawing", status: "approved", stage: "technical-design", currentRevision: 3,
    revisions: [
      { rev: 1, createdAt: "2026-03-29", authorId: "U-03", changeSummary: "First GA issued for internal review." },
      { rev: 2, createdAt: "2026-04-05", authorId: "U-03", changeSummary: "Bushing spacing revised per clearance norms." },
      { rev: 3, createdAt: "2026-07-14", authorId: "U-03", changeSummary: "Tank height +80 mm for radiator clearance — after quotation issued." },
    ],
    links: [{ toArtifactId: "CFG-0142", type: "derives-from", atRevision: 2 }], ownerId: "U-03", updatedAt: "2026-07-14",
  },
  {
    id: "SLD-0142", tenantId: TENANT.id, projectId: HERO, type: "sld-drawing", title: "Single Line Diagram", status: "approved", stage: "technical-design", currentRevision: 2,
    revisions: [
      { rev: 1, createdAt: "2026-03-30", authorId: "U-03", changeSummary: "SLD prepared." },
      { rev: 2, createdAt: "2026-04-04", authorId: "U-03", changeSummary: "Protection scheme (REF + differential) added." },
    ],
    links: [{ toArtifactId: "CFG-0142", type: "derives-from", atRevision: 2 }], ownerId: "U-03", updatedAt: "2026-04-04",
  },
  {
    id: "BOM-0142", tenantId: TENANT.id, projectId: HERO, type: "bom", title: "Bill of Material (multi-level)", status: "approved", stage: "estimation", currentRevision: 2,
    revisions: [
      { rev: 1, createdAt: "2026-04-02", authorId: "U-03", changeSummary: "BOM auto-emitted from configuration." },
      { rev: 2, createdAt: "2026-04-08", authorId: "U-04", changeSummary: "Copper weight refined to 2,180 kg per unit." },
    ],
    links: [{ toArtifactId: "CFG-0142", type: "derives-from", atRevision: 2 }], ownerId: "U-04", updatedAt: "2026-04-08",
  },
  {
    id: "COST-0142", tenantId: TENANT.id, projectId: HERO, type: "cost-sheet", title: "Cost Sheet & Margin Analysis", status: "approved", stage: "estimation", currentRevision: 2,
    revisions: [
      { rev: 1, createdAt: "2026-04-09", authorId: "U-04", changeSummary: "Costed against rate card 2026-04-01." },
      { rev: 2, createdAt: "2026-04-11", authorId: "U-04", changeSummary: "Copper @ ₹935/kg; margin set to 18.4 %." },
    ],
    links: [{ toArtifactId: "BOM-0142", type: "derives-from", atRevision: 2 }], ownerId: "U-04", updatedAt: "2026-04-11",
  },
  {
    id: "QUO-0142", tenantId: TENANT.id, projectId: HERO, type: "quotation", title: "Quotation CAN/Q/2026/0142", status: "issued", stage: "quotation", currentRevision: 3,
    revisions: [
      { rev: 1, createdAt: "2026-04-14", authorId: "U-05", changeSummary: "First offer issued." },
      { rev: 2, createdAt: "2026-04-22", authorId: "U-05", changeSummary: "Payment terms revised to 20/70/10." },
      { rev: 3, createdAt: "2026-05-02", authorId: "U-05", changeSummary: "Price firmed after negotiation; validity 60 days." },
    ],
    links: [
      { toArtifactId: "COST-0142", type: "derives-from", atRevision: 2 },
      { toArtifactId: "CMX-0142", type: "references", atRevision: 2 },
      { toArtifactId: "GA-0142", type: "references", atRevision: 2 },
    ],
    ownerId: "U-05", updatedAt: "2026-05-02", upstreamStale: true,
    meta: { note: "References GA-0142 R2 — drawing has since moved to R3." },
  },
  {
    id: "PO-0142", tenantId: TENANT.id, projectId: HERO, type: "purchase-order", title: "Customer PO 4700231188", status: "approved", stage: "purchase-order", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-05-12", authorId: "U-05", changeSummary: "PO received & auto-validated — 0 mismatches." }],
    links: [{ toArtifactId: "QUO-0142", type: "satisfies", atRevision: 3 }], ownerId: "U-05", updatedAt: "2026-05-12",
  },
  {
    id: "EPK-0142", tenantId: TENANT.id, projectId: HERO, type: "engineering-package", title: "Engineering Package (release to shop)", status: "issued", stage: "engineering-approval", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-05-16", authorId: "U-03", changeSummary: "Approved drawings, BOM, inspection & test plan bundled." }],
    links: [
      { toArtifactId: "PO-0142", type: "derives-from", atRevision: 1 },
      { toArtifactId: "GA-0142", type: "references", atRevision: 2 },
      { toArtifactId: "BOM-0142", type: "references", atRevision: 2 },
    ],
    ownerId: "U-03", updatedAt: "2026-05-16",
  },
  {
    id: "WO-0142-CORE", tenantId: TENANT.id, projectId: HERO, type: "work-order", title: "Work Order — Core Building", status: "issued", stage: "manufacturing", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-06-30", authorId: "U-07", changeSummary: "Core stacking complete for both units." }],
    links: [{ toArtifactId: "EPK-0142", type: "derives-from", atRevision: 1 }], ownerId: "U-07", updatedAt: "2026-07-16",
  },
  {
    id: "WO-0142-COIL", tenantId: TENANT.id, projectId: HERO, type: "work-order", title: "Work Order — Winding", status: "in-review", stage: "manufacturing", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-07-08", authorId: "U-07", changeSummary: "Unit 1 windings done; Unit 2 LV winding in progress." }],
    links: [{ toArtifactId: "EPK-0142", type: "derives-from", atRevision: 1 }], ownerId: "U-07", updatedAt: "2026-07-24",
  },
  {
    id: "WO-0142-TANK", tenantId: TENANT.id, projectId: HERO, type: "work-order", title: "Work Order — Tank Fabrication", status: "draft", stage: "manufacturing", currentRevision: 1,
    revisions: [{ rev: 1, createdAt: "2026-07-15", authorId: "U-07", changeSummary: "Held pending GA R3 tank height confirmation." }],
    links: [{ toArtifactId: "EPK-0142", type: "derives-from", atRevision: 1 }, { toArtifactId: "GA-0142", type: "references", atRevision: 3 }], ownerId: "U-07", updatedAt: "2026-07-15",
  },
];

/* ---- Synthesizer: a believable chain for every other project ---- */

const STAGE_PRIMARY: Partial<Record<StageKey, { type: ArtifactType; label: string; prefix: string }>> = {
  rfq: { type: "rfq", label: "RFQ / Tender Schedule", prefix: "RFQ" },
  "engineering-review": { type: "compliance-matrix", label: "Compliance Matrix", prefix: "CMX" },
  "technical-design": { type: "ga-drawing", label: "GA & SLD Drawings", prefix: "GA" },
  estimation: { type: "cost-sheet", label: "Cost Sheet & BOM", prefix: "COST" },
  quotation: { type: "quotation", label: "Quotation", prefix: "QUO" },
  "purchase-order": { type: "purchase-order", label: "Customer Purchase Order", prefix: "PO" },
  "engineering-approval": { type: "engineering-package", label: "Engineering Package", prefix: "EPK" },
  manufacturing: { type: "work-order", label: "Manufacturing Work Orders", prefix: "WO" },
  testing: { type: "test-certificate", label: "Test Certificate", prefix: "TC" },
  "quality-inspection": { type: "inspection-report", label: "Quality Inspection Report", prefix: "QIR" },
  dispatch: { type: "dispatch-note", label: "Dispatch Note", prefix: "DN" },
  commissioning: { type: "commissioning-report", label: "Commissioning Report", prefix: "CR" },
  warranty: { type: "warranty-certificate", label: "Warranty Certificate", prefix: "WC" },
};

function synthArtifacts(project: Project): Artifact[] {
  const num = projNum(project.id);
  const out: Artifact[] = [];
  let prevId: string | null = null;
  for (const st of project.stages) {
    if (st.state !== "done" && st.state !== "active") continue;
    const map = STAGE_PRIMARY[st.key];
    if (!map) continue;
    const status: ArtifactStatus = st.state === "active" ? "in-review" : "approved";
    const id = `${map.prefix}-${num}`;
    out.push({
      id,
      tenantId: TENANT.id,
      projectId: project.id,
      type: map.type,
      title: map.label,
      status,
      stage: st.key,
      currentRevision: 1,
      revisions: [{ rev: 1, createdAt: project.createdAt, authorId: st.ownerId ?? project.ownerId, changeSummary: `${map.label} prepared.` }],
      links: prevId ? [{ toArtifactId: prevId, type: "derives-from", atRevision: 1 }] : [],
      ownerId: st.ownerId ?? project.ownerId,
      updatedAt: project.createdAt,
    });
    prevId = id;
  }
  return out;
}

export function artifactsForProject(project: Project): Artifact[] {
  if (project.id === HERO) return HERO_ARTIFACTS;
  return synthArtifacts(project);
}
