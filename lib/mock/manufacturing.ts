export type ProdStage = "core" | "winding" | "tank" | "assembly" | "drying" | "testing" | "painting" | "packing";

export const PROD_STAGES: { key: ProdStage; label: string }[] = [
  { key: "core", label: "Core Building" },
  { key: "winding", label: "Winding" },
  { key: "tank", label: "Tank Fabrication" },
  { key: "assembly", label: "Assembly" },
  { key: "drying", label: "Drying / VPD" },
  { key: "testing", label: "In-line Testing" },
  { key: "painting", label: "Painting" },
  { key: "packing", label: "Packing" },
];

export type WOStatus = "queued" | "in-progress" | "hold" | "done";

export interface WorkOrder {
  id: string;
  projectId: string;
  projectShort: string;
  unit: string;
  stage: ProdStage;
  operator: string;
  machine: string;
  startedAt: string;
  progress: number;
  status: WOStatus;
  issue?: string;
}

export const WORK_ORDERS: WorkOrder[] = [
  { id: "WO-0142-C", projectId: "PRJ-2026-0142", projectShort: "MSEDCL", unit: "Unit 1 & 2 — Cores", stage: "core", operator: "Vijay Sonawane", machine: "Core Cutting CL-2", startedAt: "2026-06-30", progress: 100, status: "done" },
  { id: "WO-0142-2", projectId: "PRJ-2026-0142", projectShort: "MSEDCL", unit: "Unit 2 — Winding", stage: "winding", operator: "Sunil More", machine: "Winding Machine WM-3", startedAt: "2026-07-08", progress: 40, status: "in-progress" },
  { id: "WO-0142-T", projectId: "PRJ-2026-0142", projectShort: "MSEDCL", unit: "Tank set", stage: "tank", operator: "Iqbal Khan", machine: "Tank Fab Bay B2", startedAt: "2026-07-15", progress: 20, status: "hold", issue: "Awaiting GA R3 tank-height sign-off" },
  { id: "WO-0142-1", projectId: "PRJ-2026-0142", projectShort: "MSEDCL", unit: "Unit 1 — Assembly", stage: "assembly", operator: "Ramesh Yadav", machine: "Assembly Bay A1", startedAt: "2026-07-12", progress: 65, status: "in-progress" },
  { id: "WO-0129-D", projectId: "PRJ-2026-0129", projectShort: "GETCO", unit: "20 MVA — VPD Drying", stage: "drying", operator: "Anil Kumar", machine: "Vapour-Phase Dryer VPD-1", startedAt: "2026-07-14", progress: 100, status: "done" },
  { id: "WO-0129-T", projectId: "PRJ-2026-0129", projectShort: "GETCO", unit: "20 MVA — Routine Tests", stage: "testing", operator: "Anil Kumar", machine: "HV Test Lab HV-1", startedAt: "2026-07-18", progress: 70, status: "in-progress" },
  { id: "WO-0117-P", projectId: "PRJ-2026-0117", projectShort: "JSW", unit: "31.5 MVA — Painting", stage: "painting", operator: "Deepak Rao", machine: "Paint Booth PB-2", startedAt: "2026-07-20", progress: 85, status: "in-progress" },
  { id: "WO-0108-K", projectId: "PRJ-2026-0108", projectShort: "NTPC", unit: "50 MVA — Packing", stage: "packing", operator: "Suresh Patil", machine: "Packing Bay", startedAt: "2026-07-22", progress: 95, status: "in-progress" },
];
