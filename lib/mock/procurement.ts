export interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: "A" | "B";
  location: string;
  onTimePct: number;
}

export const VENDORS: Vendor[] = [
  { id: "V1", name: "Vedanta Ltd.", category: "Copper", rating: "A", location: "Jharsuguda", onTimePct: 94 },
  { id: "V2", name: "JSW Steel (Electrical)", category: "CRGO", rating: "A", location: "Salem", onTimePct: 90 },
  { id: "V3", name: "Apar Industries", category: "Transformer Oil", rating: "A", location: "Mumbai", onTimePct: 96 },
  { id: "V4", name: "Yash Highvoltage", category: "Bushings", rating: "A", location: "Vadodara", onTimePct: 92 },
  { id: "V5", name: "Easun-MR (TAPCON)", category: "Tap Changer", rating: "A", location: "Chennai", onTimePct: 88 },
  { id: "V6", name: "Bharat Fabricators", category: "Tank Steel", rating: "B", location: "Nagpur", onTimePct: 85 },
];

export const vendorById = (id: string) => VENDORS.find((v) => v.id === id);

export type ReqStatus = "required" | "rfq" | "po" | "received";

export interface VendorQuote {
  vendorId: string;
  vendorName: string;
  price: number;
  leadWeeks: number;
}

export interface MaterialReq {
  id: string;
  item: string;
  category: string;
  qty: number;
  unit: string;
  requiredBy: string;
  vendorId: string;
  poNo?: string;
  status: ReqStatus;
  value: number;
  quotes?: VendorQuote[];
}

const HERO_REQS: MaterialReq[] = [
  { id: "MR-1", item: "Copper conductor (HV+LV)", category: "Copper", qty: 4360, unit: "kg", requiredBy: "2026-06-20", vendorId: "V1", poNo: "PO-4400", status: "received", value: 40_76_600 },
  { id: "MR-2", item: "CRGO lamination M4", category: "CRGO", qty: 5200, unit: "kg", requiredBy: "2026-06-25", vendorId: "V2", poNo: "PO-4401", status: "received", value: 17_94_000 },
  { id: "MR-3", item: "Tank steel & fittings", category: "Tank Steel", qty: 4600, unit: "kg", requiredBy: "2026-07-05", vendorId: "V6", poNo: "PO-4402", status: "po", value: 4_23_200 },
  { id: "MR-4", item: "On-load tap changer", category: "Tap Changer", qty: 2, unit: "unit", requiredBy: "2026-07-10", vendorId: "V5", poNo: "PO-4403", status: "po", value: 19_70_000 },
  { id: "MR-5", item: "HV/LV bushings (porcelain)", category: "Bushings", qty: 14, unit: "no.", requiredBy: "2026-07-15", vendorId: "V4", poNo: "PO-4404", status: "po", value: 6_30_000 },
  { id: "MR-6", item: "Mineral oil (IS 335)", category: "Transformer Oil", qty: 8600, unit: "L", requiredBy: "2026-07-25", vendorId: "V3", status: "rfq", value: 12_47_000 },
  { id: "MR-7", item: "Radiator panels", category: "Tank Steel", qty: 38, unit: "panel", requiredBy: "2026-08-01", vendorId: "V6", status: "required", value: 1_48_200 },
];

export function requirementsFor(projectId: string): MaterialReq[] {
  if (projectId === "PRJ-2026-0142") return HERO_REQS;
  // generic: a couple of representative lines
  return HERO_REQS.slice(0, 4).map((r, i) => ({ ...r, id: `${projectId}-MR${i}`, status: (["received", "po", "rfq", "required"] as ReqStatus[])[i] }));
}

export const REQ_STATUS_ORDER: ReqStatus[] = ["required", "rfq", "po", "received"];
export const REQ_STATUS_LABEL: Record<ReqStatus, string> = { required: "Required", rfq: "Vendor RFQ", po: "PO Placed", received: "Received" };
