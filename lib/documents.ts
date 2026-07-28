import type { ArtifactType } from "./types";

export type DocCategory =
  | "Tender & RFQ"
  | "Drawings"
  | "Engineering"
  | "Commercial"
  | "Compliance"
  | "Manufacturing"
  | "Quality"
  | "Lifecycle"
  | "Correspondence";

const CATEGORY: Record<ArtifactType, DocCategory> = {
  tender: "Tender & RFQ", rfq: "Tender & RFQ", requirement: "Tender & RFQ",
  "compliance-matrix": "Compliance",
  "ga-drawing": "Drawings", "sld-drawing": "Drawings", "control-schematic": "Drawings",
  configuration: "Engineering", bom: "Engineering", "cost-sheet": "Engineering",
  quotation: "Commercial", "purchase-order": "Commercial", invoice: "Commercial",
  "engineering-package": "Manufacturing", "work-order": "Manufacturing",
  "test-certificate": "Quality", "inspection-report": "Quality",
  "dispatch-note": "Lifecycle", "commissioning-report": "Lifecycle", "warranty-certificate": "Lifecycle",
  email: "Correspondence", "meeting-note": "Correspondence", photo: "Correspondence",
};

const FORMAT: Record<ArtifactType, string> = {
  tender: "PDF", rfq: "PDF", requirement: "DOCX",
  "compliance-matrix": "XLSX",
  "ga-drawing": "DWG", "sld-drawing": "DWG", "control-schematic": "DWG",
  configuration: "JSON", bom: "XLSX", "cost-sheet": "XLSX",
  quotation: "PDF", "purchase-order": "PDF", invoice: "PDF",
  "engineering-package": "ZIP", "work-order": "PDF",
  "test-certificate": "PDF", "inspection-report": "PDF",
  "dispatch-note": "PDF", "commissioning-report": "PDF", "warranty-certificate": "PDF",
  email: "EML", "meeting-note": "DOCX", photo: "JPG",
};

export const DOC_CATEGORIES: DocCategory[] = [
  "Tender & RFQ", "Drawings", "Engineering", "Commercial",
  "Compliance", "Manufacturing", "Quality", "Lifecycle", "Correspondence",
];

export function docCategory(t: ArtifactType): DocCategory {
  return CATEGORY[t] ?? "Engineering";
}
export function docFormat(t: ArtifactType): string {
  return FORMAT[t] ?? "PDF";
}

/** deterministic pseudo file-size from the id + format */
export function docSize(id: string, format: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const base = Math.abs(h) % 100;
  if (format === "DWG" || format === "ZIP") return `${(2 + base / 20).toFixed(1)} MB`;
  if (format === "JPG") return `${(1 + base / 50).toFixed(1)} MB`;
  if (format === "XLSX" || format === "JSON") return `${120 + base * 4} KB`;
  return `${240 + base * 6} KB`;
}

export const FORMAT_TONE: Record<string, string> = {
  PDF: "bg-danger-soft text-danger",
  DWG: "bg-brand-soft text-brand",
  XLSX: "bg-ok-soft text-ok",
  DOCX: "bg-brand-soft text-brand",
  JSON: "bg-neutral-soft text-ink-3",
  ZIP: "bg-copper-soft text-copper",
  JPG: "bg-warn-soft text-warn",
  EML: "bg-neutral-soft text-ink-3",
};
