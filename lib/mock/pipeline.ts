export type OppStage = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  stage: OppStage;
  value: number; // INR
  ownerId: string;
  expectedClose: string;
  source: string;
  projectId?: string;
  lastActivity: string;
}

export const STAGE_ORDER: OppStage[] = ["new", "qualified", "proposal", "negotiation", "won"];
export const STAGE_LABEL: Record<OppStage, string> = {
  new: "New", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost",
};
export const STAGE_PROB: Record<OppStage, number> = {
  new: 0.1, qualified: 0.3, proposal: 0.5, negotiation: 0.7, won: 1, lost: 0,
};

const cr = (n: number) => n;

export const OPPORTUNITIES: Opportunity[] = [
  // Won (converted to projects)
  { id: "OPP-142", title: "MSEDCL — Nagpur Ring Sub-station", customerId: "C-01", stage: "won", value: 3_80_00_000, ownerId: "U-01", expectedClose: "2026-05-12", source: "Tender", projectId: "PRJ-2026-0142", lastActivity: "2026-05-12" },
  { id: "OPP-129", title: "GETCO — Vadodara 132kV GSS", customerId: "C-04", stage: "won", value: 6_20_00_000, ownerId: "U-01", expectedClose: "2026-02-20", source: "Tender", projectId: "PRJ-2026-0129", lastActivity: "2026-02-20" },
  { id: "OPP-117", title: "JSW — Vijayanagar Furnace Transformer", customerId: "C-06", stage: "won", value: 8_40_00_000, ownerId: "U-01", expectedClose: "2026-01-18", source: "Repeat", projectId: "PRJ-2026-0117", lastActivity: "2026-01-18" },
  // Negotiation
  { id: "OPP-160", title: "Adani — Mumbai Compact Substations", customerId: "C-07", stage: "negotiation", value: 2_70_00_000, ownerId: "U-01", expectedClose: "2026-08-20", source: "Tender", projectId: "PRJ-2026-0160", lastActivity: "2026-07-24" },
  { id: "OPP-201", title: "Torrent Power — DT Rate Contract FY27", customerId: "C-07", stage: "negotiation", value: 4_50_00_000, ownerId: "U-01", expectedClose: "2026-09-05", source: "Rate contract", lastActivity: "2026-07-22" },
  // Proposal
  { id: "OPP-138", title: "Tata Projects — Dahej Industrial Feeder", customerId: "C-02", stage: "proposal", value: 2_10_00_000, ownerId: "U-01", expectedClose: "2026-08-30", source: "EPC bid", projectId: "PRJ-2026-0138", lastActivity: "2026-07-20" },
  { id: "OPP-151", title: "UltraTech — Awarpur Distribution Upgrade", customerId: "C-03", stage: "proposal", value: 1_42_00_000, ownerId: "U-01", expectedClose: "2026-09-15", source: "Direct", projectId: "PRJ-2026-0151", lastActivity: "2026-07-18" },
  { id: "OPP-205", title: "L&T — Hyderabad Metro Traction PS", customerId: "C-05", stage: "proposal", value: 5_60_00_000, ownerId: "U-01", expectedClose: "2026-10-10", source: "EPC bid", lastActivity: "2026-07-19" },
  // Qualified
  { id: "OPP-162", title: "Sterlite — Bhadla Auto-Transformer Package", customerId: "C-09", stage: "qualified", value: 18_00_00_000, ownerId: "U-02", expectedClose: "2026-11-30", source: "Tender", projectId: "PRJ-2026-0162", lastActivity: "2026-07-26" },
  { id: "OPP-210", title: "NTPC — Barh 400kV Aux Transformers", customerId: "C-08", stage: "qualified", value: 22_50_00_000, ownerId: "U-01", expectedClose: "2026-12-15", source: "Tender", lastActivity: "2026-07-25" },
  // New
  { id: "OPP-155", title: "L&T — Chennai Metro Phase-2 Switchgear", customerId: "C-05", stage: "new", value: 95_00_000, ownerId: "U-02", expectedClose: "2027-02-28", source: "EPC bid", projectId: "PRJ-2026-0155", lastActivity: "2026-07-09" },
  { id: "OPP-212", title: "Siemens Energy — Cast Resin Framework (EU)", customerId: "C-10", stage: "new", value: 9_80_00_000, ownerId: "U-01", expectedClose: "2027-03-31", source: "Export enquiry", lastActivity: "2026-07-14" },
  { id: "OPP-214", title: "MSEDCL — Pune Urban Feeder Package", customerId: "C-01", stage: "new", value: 6_40_00_000, ownerId: "U-01", expectedClose: "2027-01-20", source: "Tender", lastActivity: "2026-07-27" },
  // Lost
  { id: "OPP-198", title: "Adani — Khavda 220kV (lost on price)", customerId: "C-07", stage: "lost", value: 12_00_00_000, ownerId: "U-01", expectedClose: "2026-06-10", source: "Tender", lastActivity: "2026-06-10" },
];
