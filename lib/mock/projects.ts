import type { Project, ProjectStage, StageKey, StageState } from "../types";
import { LIFECYCLE, stageIndex } from "../lifecycle";
import { TENANT } from "./org";

interface StageOverrides {
  blocked?: StageKey[];
  skipped?: StageKey[];
  notes?: Partial<Record<StageKey, string>>;
  owners?: Partial<Record<StageKey, string>>;
  dates?: Partial<Record<StageKey, string>>;
}

/** Generate the 22-stage array: everything before current = done, current = active, rest = pending. */
function buildStages(current: StageKey, o: StageOverrides = {}): ProjectStage[] {
  const curIdx = stageIndex(current);
  return LIFECYCLE.map((meta) => {
    let state: StageState;
    if (o.skipped?.includes(meta.key)) state = "skipped";
    else if (o.blocked?.includes(meta.key)) state = "blocked";
    else if (meta.order < curIdx) state = "done";
    else if (meta.order === curIdx) state = "active";
    else state = "pending";
    return {
      key: meta.key,
      state,
      note: o.notes?.[meta.key],
      ownerId: o.owners?.[meta.key],
      completedAt: state === "done" ? o.dates?.[meta.key] : undefined,
      startedAt: state === "active" ? o.dates?.[meta.key] : undefined,
      artifactIds: [],
    };
  });
}

const INR = (amount: number) => ({ amount, currency: "INR" as const });

export const PROJECTS: Project[] = [
  {
    id: "PRJ-2026-0142",
    tenantId: TENANT.id,
    title: "MSEDCL — Nagpur Ring Sub-station Package",
    customerId: "C-01",
    ownerId: "U-01",
    currentStage: "manufacturing",
    health: "at-risk",
    priority: "high",
    value: INR(3_80_00_000),
    marginPct: 18.4,
    createdAt: "2026-03-04",
    targetDelivery: "2026-09-15",
    location: "Nagpur, Maharashtra",
    tags: ["Power Transformer", "33/11kV", "Utility"],
    productSummary: "2 × 5 MVA 33/11 kV ONAN Power Transformers",
    stages: buildStages("manufacturing", {
      notes: {
        procurement: "CRGO lamination delivery slipped 10 days — recovery plan in place.",
        manufacturing: "Unit 1 core-coil assembly in Bay 2 · Unit 2 winding in progress.",
        quotation: "GA drawing revised to R3 after quote issued — commercial impact under review.",
      },
      owners: { manufacturing: "U-07", procurement: "U-06", quotation: "U-05" },
      dates: { manufacturing: "2026-06-30" },
    }),
  },
  {
    id: "PRJ-2026-0138",
    tenantId: TENANT.id,
    title: "Tata Projects — Dahej Industrial Feeder",
    customerId: "C-02",
    ownerId: "U-01",
    currentStage: "quotation",
    health: "on-track",
    priority: "high",
    value: INR(2_10_00_000),
    marginPct: 21.0,
    createdAt: "2026-05-18",
    targetDelivery: "2026-11-30",
    location: "Dahej, Gujarat",
    tags: ["Power Transformer", "66/11kV", "EPC"],
    productSummary: "10 MVA 66/11 kV ONAF Power Transformer",
    stages: buildStages("quotation", { owners: { quotation: "U-05" } }),
  },
  {
    id: "PRJ-2026-0151",
    tenantId: TENANT.id,
    title: "UltraTech — Awarpur Plant Distribution Upgrade",
    customerId: "C-03",
    ownerId: "U-01",
    currentStage: "estimation",
    health: "on-track",
    priority: "medium",
    value: INR(1_42_00_000),
    marginPct: 19.2,
    createdAt: "2026-06-22",
    targetDelivery: "2026-12-20",
    location: "Awarpur, Maharashtra",
    tags: ["Distribution Transformer", "Industrial"],
    productSummary: "3 × 2500 kVA 11/0.433 kV Distribution Transformers",
    stages: buildStages("estimation", { owners: { estimation: "U-04" } }),
  },
  {
    id: "PRJ-2026-0129",
    tenantId: TENANT.id,
    title: "GETCO — Vadodara 132kV GSS Augmentation",
    customerId: "C-04",
    ownerId: "U-01",
    currentStage: "testing",
    health: "on-track",
    priority: "critical",
    value: INR(6_20_00_000),
    marginPct: 16.8,
    createdAt: "2026-01-28",
    targetDelivery: "2026-08-10",
    location: "Vadodara, Gujarat",
    tags: ["Power Transformer", "132/33kV", "Utility"],
    productSummary: "20 MVA 132/33 kV ONAN/ONAF Power Transformer",
    stages: buildStages("testing", {
      owners: { testing: "U-08" },
      notes: { testing: "Routine tests complete · Impulse (type test) scheduled with client witness." },
    }),
  },
  {
    id: "PRJ-2026-0155",
    tenantId: TENANT.id,
    title: "L&T — Chennai Metro Phase-2 Switchgear",
    customerId: "C-05",
    ownerId: "U-01",
    currentStage: "rfq",
    health: "on-track",
    priority: "medium",
    value: INR(95_00_000),
    createdAt: "2026-07-09",
    targetDelivery: "2027-02-28",
    location: "Chennai, Tamil Nadu",
    tags: ["Switchgear", "VCB", "RMU", "EPC"],
    productSummary: "11 kV VCB Panels + RMU package (12 bays)",
    stages: buildStages("rfq", { owners: { rfq: "U-02" } }),
  },
  {
    id: "PRJ-2026-0117",
    tenantId: TENANT.id,
    title: "JSW Steel — Vijayanagar Furnace Transformer",
    customerId: "C-06",
    ownerId: "U-01",
    currentStage: "dispatch",
    health: "on-track",
    priority: "high",
    value: INR(8_40_00_000),
    marginPct: 15.5,
    createdAt: "2025-12-15",
    targetDelivery: "2026-08-05",
    location: "Bellary, Karnataka",
    tags: ["Furnace Transformer", "132/33kV", "Industrial"],
    productSummary: "31.5 MVA 132/33 kV Furnace Duty Transformer",
    stages: buildStages("dispatch", { owners: { dispatch: "U-07" } }),
  },
  {
    id: "PRJ-2026-0160",
    tenantId: TENANT.id,
    title: "Adani Electricity — Mumbai Compact Substations",
    customerId: "C-07",
    ownerId: "U-01",
    currentStage: "negotiation",
    health: "at-risk",
    priority: "high",
    value: INR(2_70_00_000),
    marginPct: 14.0,
    createdAt: "2026-06-02",
    targetDelivery: "2027-01-15",
    location: "Mumbai, Maharashtra",
    tags: ["Compact Substation", "Utility"],
    productSummary: "5 × 1000 kVA Compact Secondary Substations",
    stages: buildStages("negotiation", {
      owners: { negotiation: "U-01" },
      notes: { negotiation: "Customer seeking 6% price reduction — margin floor at 12%." },
    }),
  },
  {
    id: "PRJ-2026-0108",
    tenantId: TENANT.id,
    title: "NTPC — Solapur STPP 220kV Auxiliary",
    customerId: "C-08",
    ownerId: "U-01",
    currentStage: "commissioning",
    health: "on-track",
    priority: "critical",
    value: INR(14_50_00_000),
    marginPct: 17.2,
    createdAt: "2025-09-10",
    targetDelivery: "2026-07-30",
    location: "Solapur, Maharashtra",
    tags: ["Power Transformer", "220/33kV", "Government"],
    productSummary: "50 MVA 220/33 kV ONAN/ONAF/OFAF Power Transformer",
    stages: buildStages("commissioning", { owners: { commissioning: "U-08" } }),
  },
  {
    id: "PRJ-2026-0162",
    tenantId: TENANT.id,
    title: "Sterlite Power — Bhadla Auto-Transformer Package",
    customerId: "C-09",
    ownerId: "U-01",
    currentStage: "qualification",
    health: "on-track",
    priority: "high",
    value: INR(18_00_00_000),
    createdAt: "2026-07-20",
    targetDelivery: "2027-06-30",
    location: "Bhadla, Rajasthan",
    tags: ["Auto Transformer", "400/220kV", "EPC"],
    productSummary: "3 × 40 MVA 400/220 kV Auto Transformers",
    stages: buildStages("qualification", { owners: { qualification: "U-02" } }),
  },
  {
    id: "PRJ-2026-0095",
    tenantId: TENANT.id,
    title: "Siemens Energy — Cast Resin Export Order (DE)",
    customerId: "C-10",
    ownerId: "U-01",
    currentStage: "warranty",
    health: "on-track",
    priority: "medium",
    value: INR(4_10_00_000),
    marginPct: 22.5,
    createdAt: "2025-07-14",
    targetDelivery: "2026-03-20",
    location: "Munich, Germany",
    tags: ["Cast Resin", "33/6.9kV", "Export"],
    productSummary: "8 MVA 33/6.9 kV Cast Resin Dry-Type Transformer",
    stages: buildStages("warranty", {
      skipped: ["amc"],
      owners: { warranty: "U-01" },
    }),
  },
];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
