/**
 * Tenant configuration — the data that makes OneERP a multi-tenant product.
 * Workflows, standards and rate cards are all DATA, editable per tenant.
 */

export interface WorkflowConfig {
  artifactType: string;
  label: string;
  states: string[];
  approvalChain: string[];
}

export const WORKFLOWS: WorkflowConfig[] = [
  { artifactType: "quotation", label: "Quotation", states: ["Draft", "In Review", "Approved", "Issued", "Revised"], approvalChain: ["Sales", "Engineering", "Commercial", "Director"] },
  { artifactType: "ga-drawing", label: "GA Drawing", states: ["Draft", "In Review", "Approved", "Superseded"], approvalChain: ["Design Engineer", "Chief Engineer", "Customer"] },
  { artifactType: "purchase-order", label: "Purchase Order", states: ["Received", "Validated", "Approved", "Converted"], approvalChain: ["Commercial", "Director"] },
  { artifactType: "test-certificate", label: "Test Certificate", states: ["Draft", "Witnessed", "Approved", "Issued"], approvalChain: ["Test Engineer", "QA Head", "Customer"] },
];

export interface StandardRef {
  code: string;
  title: string;
  scope: "global" | "tenant";
}

export const STANDARDS: StandardRef[] = [
  { code: "IS 2026", title: "Power Transformers", scope: "global" },
  { code: "IS 1180", title: "Distribution Transformers", scope: "global" },
  { code: "IEC 60076", title: "Power Transformers (international)", scope: "global" },
  { code: "IEEE C57", title: "Transformers (IEEE)", scope: "global" },
  { code: "IS 335", title: "Insulating Oil", scope: "global" },
  { code: "CANDRON-QAP-01", title: "Internal Quality Assurance Plan", scope: "tenant" },
  { code: "CANDRON-TS-11kV", title: "Standard 11 kV Design Specification", scope: "tenant" },
];

export interface RateCardVersion {
  effectiveFrom: string;
  label: string;
  active?: boolean;
}

export const RATE_CARD_HISTORY: RateCardVersion[] = [
  { effectiveFrom: "2026-07-01", label: "Current", active: true },
  { effectiveFrom: "2026-04-01", label: "Q1 FY27" },
  { effectiveFrom: "2026-01-01", label: "Q4 FY26" },
  { effectiveFrom: "2025-10-01", label: "Q3 FY26" },
];

export const BRAND_COLORS = ["#2050e0", "#0f9d63", "#b0602c", "#6d3fd4", "#c2334f", "#0e7490"];
