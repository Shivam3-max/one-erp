import type { ComplianceStatus } from "../types";
import { PROJECTS } from "./projects";
import { stageIndex } from "../lifecycle";

export interface ComplianceItem {
  id: string;
  clause: string;
  category: string;
  requirement: string;
  companySpec: string;
  status: ComplianceStatus;
  deviation?: string;
  engineerComment?: string;
  engineerId: string;
}

/** Hand-authored matrix for the hero project — realistic 33/11 kV tender clauses. */
const HERO_MATRIX: ComplianceItem[] = [
  { id: "1", clause: "3.1", category: "Ratings", requirement: "Rated power 5000 kVA, ONAN", companySpec: "5 MVA ONAN", status: "comply", engineerId: "U-02" },
  { id: "2", clause: "3.2", category: "Ratings", requirement: "Voltage ratio 33 / 11 kV", companySpec: "33 / 11 kV", status: "comply", engineerId: "U-02" },
  { id: "3", clause: "3.3", category: "Ratings", requirement: "Vector group Dyn11", companySpec: "Dyn11", status: "comply", engineerId: "U-02" },
  { id: "4", clause: "3.5", category: "Performance", requirement: "Percentage impedance 6.25% ± 10%", companySpec: "6.25%", status: "comply", engineerId: "U-03" },
  { id: "5", clause: "4.1", category: "Losses", requirement: "No-load loss ≤ 3.5 kW", companySpec: "3.7 kW guaranteed", status: "deviate", deviation: "+0.2 kW over specified", engineerComment: "Meeting 3.5 kW needs amorphous core (+₹6.2 L/unit). 3.7 kW offered; capitalized-loss impact shared with customer — accepted.", engineerId: "U-03" },
  { id: "6", clause: "4.2", category: "Losses", requirement: "Load loss ≤ 40 kW at 75 °C", companySpec: "34 kW", status: "comply", engineerId: "U-03" },
  { id: "7", clause: "5.1", category: "Thermal", requirement: "Temp rise 50 / 55 °C (oil/winding)", companySpec: "50 / 55 °C", status: "comply", engineerId: "U-03" },
  { id: "8", clause: "5.4", category: "Insulation", requirement: "BIL 170 kV / power-frequency 70 kV", companySpec: "170 kV / 70 kV", status: "comply", engineerId: "U-03" },
  { id: "9", clause: "6.2", category: "Tap changer", requirement: "OLTC ± 10%, 17 steps, with RTCC", companySpec: "OLTC ±10%, 17 steps, RTCC", status: "comply", engineerId: "U-03" },
  { id: "10", clause: "7.1", category: "Bushings", requirement: "33 kV HV bushings — polymer (composite)", companySpec: "Porcelain offered", status: "deviate", deviation: "Porcelain vs specified polymer", engineerComment: "Polymer available at +₹9,000/set. Porcelain offered as base; polymer as priced option in commercial offer.", engineerId: "U-03" },
  { id: "11", clause: "8.1", category: "Protection", requirement: "Buchholz, PRV, OTI, WTI, MOG", companySpec: "All included", status: "comply", engineerId: "U-03" },
  { id: "12", clause: "8.4", category: "Protection", requirement: "Marshalling box IP55", companySpec: "IP55 powder-coated", status: "comply", engineerId: "U-03" },
  { id: "13", clause: "9.1", category: "Finish", requirement: "Paint shade RAL 7035, DFT 120 µm", companySpec: "RAL 7035, 120 µm", status: "comply", engineerId: "U-07" },
  { id: "14", clause: "10.1", category: "Testing", requirement: "Routine + type + short-circuit test", companySpec: "Routine + type; SC witnessed at CPRI", status: "note", engineerComment: "Short-circuit test is chargeable and conducted at CPRI; certificate reference for identical design can be furnished to waive.", engineerId: "U-08" },
  { id: "15", clause: "11.1", category: "Standards", requirement: "IS 2026 / IEC 60076", companySpec: "IS 2026 & IEC 60076", status: "comply", engineerId: "U-02" },
  { id: "16", clause: "12.1", category: "Commercial", requirement: "Warranty 60 months from commissioning", companySpec: "24 months standard", status: "deviate", deviation: "24 vs 60 months", engineerComment: "Standard warranty 24 months. 60-month extended warranty offered at 3.5% of ex-works — line-itemed in commercial offer.", engineerId: "U-05" },
  { id: "17", clause: "13.1", category: "Documentation", requirement: "GA, SLD, test reports, O&M manuals", companySpec: "Full document set", status: "comply", engineerId: "U-02" },
];

const UNIVERSAL: Omit<ComplianceItem, "engineerId">[] = [
  { id: "g1", clause: "3.1", category: "Ratings", requirement: "Rated power as per schedule", companySpec: "As configured", status: "comply" },
  { id: "g2", clause: "3.2", category: "Ratings", requirement: "Voltage ratio as per schedule", companySpec: "As configured", status: "comply" },
  { id: "g3", clause: "4.1", category: "Losses", requirement: "Losses within specified limits", companySpec: "Within limits", status: "comply" },
  { id: "g4", clause: "5.1", category: "Thermal", requirement: "Temperature rise per IS 2026", companySpec: "50 / 55 °C", status: "comply" },
  { id: "g5", clause: "8.1", category: "Protection", requirement: "Standard protection package", companySpec: "Included", status: "comply" },
  { id: "g6", clause: "10.1", category: "Testing", requirement: "Routine tests per IS 2026", companySpec: "Included", status: "comply" },
  { id: "g7", clause: "11.1", category: "Standards", requirement: "Applicable IS / IEC standards", companySpec: "Compliant", status: "comply" },
];

export function getCompliance(projectId: string): ComplianceItem[] {
  if (projectId === "PRJ-2026-0142") return HERO_MATRIX;
  return UNIVERSAL.map((r) => ({ ...r, engineerId: "U-02" }));
}

/** Projects far enough along to have a compliance matrix. */
export function projectsWithCompliance() {
  return PROJECTS.filter((p) => stageIndex(p.currentStage) >= stageIndex("engineering-review")).map((p) => ({ id: p.id, title: p.title }));
}
