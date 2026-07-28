import { CUSTOMERS } from "./org";

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
  primary?: boolean;
}

export interface Comm {
  id: string;
  type: "email" | "call" | "meeting" | "site-visit";
  subject: string;
  date: string;
  userId: string;
  summary: string;
}

const CONTACTS: Record<string, Contact[]> = {
  "C-01": [{ name: "S. R. Deshmukh", role: "Superintending Engineer", email: "se.nagpur@mahadiscom.in", phone: "+91 712 255 3300", primary: true }, { name: "A. Kulkarni", role: "Executive Engineer (Proc.)", email: "ee.proc@mahadiscom.in", phone: "+91 712 255 3312" }],
  "C-02": [{ name: "Rohan Malhotra", role: "GM — Electrical", email: "rohan.m@tataprojects.com", phone: "+91 40 6717 2000", primary: true }, { name: "Kavya Reddy", role: "Procurement Lead", email: "kavya.r@tataprojects.com", phone: "+91 40 6717 2044" }],
  "C-03": [{ name: "Manish Agarwal", role: "Head — Plant Electrical", email: "manish.a@ultratech.com", phone: "+91 22 6691 7800", primary: true }],
  "C-04": [{ name: "H. B. Patel", role: "Chief Engineer (Trans.)", email: "ce.trans@getco.gujarat.gov.in", phone: "+91 265 231 0500", primary: true }, { name: "N. Solanki", role: "Dy. Engineer", email: "de@getco.gujarat.gov.in", phone: "+91 265 231 0522" }],
  "C-05": [{ name: "Prakash Iyer", role: "Project Director", email: "prakash.i@lntecc.com", phone: "+91 44 2252 8000", primary: true }],
  "C-06": [{ name: "Vikas Sharma", role: "AGM — Utilities", email: "vikas.sharma@jsw.in", phone: "+91 8392 250 100", primary: true }, { name: "R. Naidu", role: "Purchase Manager", email: "r.naidu@jsw.in", phone: "+91 8392 250 140" }],
  "C-07": [{ name: "Farhan Sheikh", role: "DGM — Capex", email: "farhan.s@adanielectricity.com", phone: "+91 22 5060 0000", primary: true }],
  "C-08": [{ name: "R. K. Verma", role: "AGM (Electrical-C&M)", email: "rkverma@ntpc.co.in", phone: "+91 11 2436 0100", primary: true }, { name: "S. Bhatt", role: "Engineer (Proc.)", email: "sbhatt@ntpc.co.in", phone: "+91 11 2436 0140" }],
  "C-09": [{ name: "Aditya Rao", role: "Head — Substations", email: "aditya.rao@sterlitepower.com", phone: "+91 124 471 5000", primary: true }],
  "C-10": [{ name: "Klaus Werner", role: "Procurement Manager", email: "klaus.werner@siemens-energy.com", phone: "+49 89 636 00", primary: true }],
};

export const contactsFor = (customerId: string): Contact[] => CONTACTS[customerId] ?? [];

const TEMPLATES: { type: Comm["type"]; subject: string; summary: string; userId: string }[] = [
  { type: "site-visit", subject: "Site survey & requirement study", summary: "Visited site, captured layout constraints and clearances for the GA.", userId: "U-02" },
  { type: "meeting", subject: "Pre-bid technical meeting", summary: "Clarified loss capitalization and testing scope with the engineering cell.", userId: "U-02" },
  { type: "email", subject: "Technical clarification — losses & impedance", summary: "Responded to queries on guaranteed losses; shared datasheet revision.", userId: "U-03" },
  { type: "email", subject: "Quotation submitted", summary: "Submitted commercial + technical offer with compliance matrix.", userId: "U-05" },
  { type: "call", subject: "Delivery schedule discussion", summary: "Aligned on 20-week delivery and inspection milestones.", userId: "U-01" },
  { type: "meeting", subject: "Commercial negotiation", summary: "Discussed price, payment terms and extended-warranty option.", userId: "U-05" },
];

/** Deterministic communication timeline per customer. */
export function commsFor(customerId: string): Comm[] {
  const idx = CUSTOMERS.findIndex((c) => c.id === customerId);
  const count = 4 + (idx % 3);
  const out: Comm[] = [];
  const baseDay = new Date("2026-07-24").getTime();
  for (let i = 0; i < count; i++) {
    const t = TEMPLATES[(idx + i) % TEMPLATES.length];
    const date = new Date(baseDay - (i * 9 + idx) * 86_400_000).toISOString().slice(0, 10);
    out.push({ id: `${customerId}-CM${i}`, ...t, date });
  }
  return out;
}
