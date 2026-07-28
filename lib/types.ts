/**
 * CANDRON OneERP — Canonical Object Model
 * ----------------------------------------
 * This file is the single source of truth for the domain. In Phase 1 it types the
 * mock data layer; in Phase 2 these shapes map 1:1 onto the Prisma schema, so wiring
 * the real database is a swap of the data source — not a rewrite of the screens.
 *
 * Design tenets (see architecture brief):
 *   - The Project is the root. Everything belongs inside a Project.
 *   - Every business object is an Artifact: a versioned node that references its parents.
 *   - The references form a directed traceability GRAPH ("nothing exists independently").
 *   - Multi-tenant from day one: CANDRON is tenant #1; every row carries tenantId.
 *   - Product families, workflows and rate cards are DATA, not code.
 */

export type ID = string;
export type ISODate = string; // "2026-07-27" or full ISO timestamp

export type Currency = "INR" | "USD" | "EUR";
export interface Money {
  amount: number;
  currency: Currency;
}

/* ============================================================
 * TENANCY & IDENTITY
 * ==========================================================*/

export interface Tenant {
  id: ID;
  name: string;              // "CANDRON Electricals Pvt. Ltd."
  code: string;              // "CANDRON"
  logoText: string;
  primaryCurrency: Currency;
  country: string;
}

export type DepartmentKey =
  | "sales"
  | "application-engineering"
  | "design-engineering"
  | "estimation"
  | "procurement"
  | "manufacturing"
  | "quality"
  | "commercial"
  | "management";

export interface User {
  id: ID;
  tenantId: ID;
  name: string;
  initials: string;
  role: string;              // human-readable title
  department: DepartmentKey;
  email: string;
}

/* ============================================================
 * CRM  (Sales department)
 * ==========================================================*/

export type CustomerType =
  | "utility"          // State/central electricity boards, DISCOMs
  | "epc"              // EPC contractors
  | "industrial"       // Cement, steel, chemical plants
  | "oem"
  | "government"
  | "export";

export interface Customer {
  id: ID;
  tenantId: ID;
  name: string;
  type: CustomerType;
  city: string;
  state: string;
  country: string;
  gstin?: string;
  rating: "A" | "B" | "C";   // credit / strategic rating
  since: ISODate;
}

export type LeadStage =
  | "new"
  | "qualified"
  | "opportunity"
  | "won"
  | "lost";

export interface Lead {
  id: ID;
  tenantId: ID;
  customerId: ID;
  title: string;
  stage: LeadStage;
  estValue: Money;
  source: string;
  owner: ID; // userId
  createdAt: ISODate;
}

/* ============================================================
 * THE SPINE — Project, lifecycle stages, artifacts, graph
 * ==========================================================*/

/** The full electrical-infrastructure project lifecycle (per vision doc). */
export type StageKey =
  | "lead"
  | "qualification"
  | "rfq"
  | "engineering-review"
  | "technical-design"
  | "estimation"
  | "quotation"
  | "negotiation"
  | "purchase-order"
  | "engineering-approval"
  | "procurement"
  | "inventory-reservation"
  | "manufacturing"
  | "testing"
  | "quality-inspection"
  | "packing"
  | "dispatch"
  | "installation"
  | "commissioning"
  | "warranty"
  | "amc"
  | "repeat-business";

export type StageState = "done" | "active" | "pending" | "blocked" | "skipped";

export interface StageMeta {
  key: StageKey;
  label: string;
  department: DepartmentKey;
  /** ordered index in the lifecycle */
  order: number;
}

export interface ProjectStage {
  key: StageKey;
  state: StageState;
  startedAt?: ISODate;
  completedAt?: ISODate;
  ownerId?: ID;
  note?: string;
  /** artifact ids produced/anchored at this stage */
  artifactIds: ID[];
}

export type ProjectHealth = "on-track" | "at-risk" | "critical" | "closed";
export type ProjectPriority = "low" | "medium" | "high" | "critical";

export interface Project {
  id: ID;                    // e.g. "PRJ-2026-0142"
  tenantId: ID;
  title: string;
  customerId: ID;
  ownerId: ID;
  currentStage: StageKey;
  health: ProjectHealth;
  priority: ProjectPriority;
  value: Money;              // order/quotation value
  marginPct?: number;
  createdAt: ISODate;
  targetDelivery?: ISODate;
  location: string;
  tags: string[];
  productSummary: string;    // "2 × 5 MVA 33/11kV Power Transformers"
  stages: ProjectStage[];
}

/** Every document/entity that lives inside a project is an Artifact. */
export type ArtifactType =
  | "tender"
  | "rfq"
  | "requirement"
  | "compliance-matrix"
  | "ga-drawing"
  | "sld-drawing"
  | "control-schematic"
  | "configuration"
  | "bom"
  | "cost-sheet"
  | "quotation"
  | "purchase-order"
  | "engineering-package"
  | "work-order"
  | "test-certificate"
  | "inspection-report"
  | "dispatch-note"
  | "commissioning-report"
  | "warranty-certificate"
  | "invoice"
  | "email"
  | "meeting-note"
  | "photo";

export type ArtifactStatus =
  | "draft"
  | "in-review"
  | "approved"
  | "issued"
  | "superseded"
  | "rejected";

export type LinkType =
  | "derives-from"    // this artifact was generated from parent
  | "satisfies"       // this artifact fulfils a parent requirement
  | "references"      // soft reference
  | "supersedes";     // this revision replaces another

export interface ArtifactLink {
  toArtifactId: ID;
  type: LinkType;
  /** the revision of the parent this link was made against (for staleness) */
  atRevision: number;
}

export interface Revision {
  rev: number;
  createdAt: ISODate;
  authorId: ID;
  /** short human summary of exactly what changed in this revision */
  changeSummary: string;
}

export interface Artifact {
  id: ID;                    // e.g. "QUO-0142-R3"
  tenantId: ID;
  projectId: ID;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  stage: StageKey;           // where it anchors on the spine
  currentRevision: number;
  revisions: Revision[];
  links: ArtifactLink[];     // typed edges to parent artifacts
  ownerId: ID;
  updatedAt: ISODate;
  /**
   * True when a parent artifact has revised past the revision this artifact
   * linked against. The signature behaviour: flag, never silently mutate.
   */
  upstreamStale?: boolean;
  meta?: Record<string, string | number>;
}

/* ============================================================
 * CONFIGURATOR — product families as data (the compiler)
 * ==========================================================*/

export type AttributeType = "enum" | "number" | "boolean" | "text" | "reference";

export interface AttributeOption {
  value: string;
  label: string;
}

export interface Attribute {
  id: ID;
  familyId: ID;
  group: string;             // "Ratings", "Cooling", "Tank", ...
  label: string;
  type: AttributeType;
  unit?: string;             // "kVA", "kV", "°C"
  options?: AttributeOption[];
  default?: string | number | boolean;
  required?: boolean;
  /** attribute drives a BOM line and/or a cost driver */
  drivesBom?: boolean;
}

/** condition → effect; the rule engine's atom (kept simple by design). */
export interface Rule {
  id: ID;
  familyId: ID;
  when: string;              // e.g. "cooling == 'ONAN'"
  then: string;              // e.g. "require('radiator')"
  message?: string;
}

export interface ProductFamily {
  id: ID;
  tenantId: ID;
  name: string;              // "Power Transformer", "RMU", "VCB Panel"
  category: string;          // "Transformers", "Switchgear"
  attributeCount: number;
  active: boolean;
}

export interface Configuration {
  id: ID;
  tenantId: ID;
  projectId: ID;
  familyId: ID;
  values: Record<string, string | number | boolean>; // keyed by attribute id
  validated: boolean;
  issues: string[];
}

/* ============================================================
 * BOM — the pivot (config → cost → procurement → manufacturing)
 * ==========================================================*/

export type MaterialCategory =
  | "copper"
  | "crgo"
  | "steel"
  | "oil"
  | "bushings"
  | "tap-changer"
  | "accessories"
  | "paint"
  | "hardware";

export interface BomLine {
  id: ID;
  category: MaterialCategory;
  description: string;
  qty: number;
  unit: string;
  level: number;             // multi-level BOM depth
}

export interface Bom {
  id: ID;
  tenantId: ID;
  projectId: ID;
  configurationId: ID;
  lines: BomLine[];
}

/* ============================================================
 * ESTIMATION — cost sheet + temporal rate cards
 * ==========================================================*/

export interface RateCard {
  id: ID;
  tenantId: ID;
  effectiveFrom: ISODate;    // temporal: old quotes reproduce original cost
  rates: Record<MaterialCategory, Money>; // per-unit rate
}

export interface CostLine {
  label: string;
  category?: MaterialCategory;
  amount: Money;
  kind: "material" | "labour" | "overhead" | "logistics" | "tax" | "margin";
}

export interface CostSheet {
  id: ID;
  tenantId: ID;
  projectId: ID;
  bomId: ID;
  rateCardId: ID;
  lines: CostLine[];
  estimatedCost: Money;
  sellingPrice: Money;
  marginPct: number;
  contribution: Money;
  breakEven: Money;
}

/* ============================================================
 * QUOTATION — document assembly (blocks), compliance, revisions
 * ==========================================================*/

export type QuoteBlockType =
  | "cover-letter"
  | "commercial-offer"
  | "technical-offer"
  | "compliance-matrix"
  | "scope"
  | "exclusions"
  | "drawings"
  | "commercial-terms"
  | "revision-history";

export interface QuoteBlock {
  type: QuoteBlockType;
  title: string;
  included: boolean;
}

export type ComplianceStatus = "comply" | "deviate" | "note" | "not-applicable";

export interface ComplianceRow {
  requirement: string;
  companySpec: string;
  status: ComplianceStatus;
  deviation?: string;
  engineerComment?: string;
}

/* ============================================================
 * WORKFLOW — configurable state machine (data, not code)
 * ==========================================================*/

export interface WorkflowTransition {
  from: string;
  to: string;
  role: string;              // who may perform it
  requiresApproval?: boolean;
}

export interface WorkflowDef {
  id: ID;
  tenantId: ID;
  artifactType: ArtifactType;
  states: string[];
  transitions: WorkflowTransition[];
  /** ordered approval chain for this tenant, e.g. Sales → Eng → Commercial → Director */
  approvalChain: string[];
}

/* ============================================================
 * ACTIVITY — cross-cutting audit feed
 * ==========================================================*/

export interface Activity {
  id: ID;
  tenantId: ID;
  projectId?: ID;
  actorId: ID;
  verb: string;              // "issued", "approved", "revised", "flagged"
  target: string;
  at: ISODate;
}
