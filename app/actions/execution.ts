"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can, type Perm } from "@/lib/permissions";

const today = () => new Date().toISOString().slice(0, 10);

async function authorize(perm: Perm) {
  const user = await requireUser();
  if (!can(user, perm)) throw new Error("You don't have permission to perform this action.");
  return user;
}

/* ---------------- Procurement ---------------- */

const REQ_ORDER = ["required", "rfq", "po", "received"];

async function nextPoNo() {
  const withPo = await prisma.materialReq.findMany({ where: { poNo: { not: null } }, select: { poNo: true } });
  const maxN = withPo.reduce((m: number, x: { poNo: string | null }) => {
    const n = parseInt((x.poNo || "").split("-").pop() || "0", 10);
    return Math.max(m, Number.isNaN(n) ? 0 : n);
  }, 4400);
  return `PO-${maxN + 1}`;
}

/** Raise an RFQ: generate quotes from vendors in the category. */
export async function raiseRFQ(reqId: string) {
  const user = await authorize("procurement.manage");
  const r = await prisma.materialReq.findUnique({ where: { id: reqId } });
  if (!r || r.status === "po" || r.status === "received") return { ok: false };
  const vendors = await prisma.vendor.findMany({ where: { tenantId: user.tenantId } });
  // Primary vendors for this category first, then padded with alternates so the
  // buyer always gets a genuine multi-vendor comparison (min 2, max 3 quotes).
  const sameCat = vendors.filter((v: { category: string }) => v.category === r.category);
  const others = vendors.filter((v: { category: string }) => v.category !== r.category).sort((a: { onTimePct: number }, b: { onTimePct: number }) => b.onTimePct - a.onTimePct);
  const pool = [...sameCat, ...others].slice(0, 3);
  const quotes = pool.map((v, i) => ({
    vendorId: v.id,
    vendorName: v.name,
    price: Math.round(r.value * (0.95 + i * 0.06 + Math.random() * 0.04)),
    leadWeeks: 5 + i * 2,
  }));
  await prisma.materialReq.update({ where: { id: reqId }, data: { status: "rfq", quotes } });
  revalidatePath("/procurement");
  return { ok: true, count: quotes.length };
}

/** Award the PO to a vendor from the RFQ comparison. */
export async function awardPO(reqId: string, vendorId: string) {
  await authorize("procurement.manage");
  const r = await prisma.materialReq.findUnique({ where: { id: reqId } });
  if (!r) return { ok: false };
  const quotes = (r.quotes as { vendorId: string; price: number }[] | null) ?? [];
  const q = quotes.find((x) => x.vendorId === vendorId);
  await prisma.materialReq.update({
    where: { id: reqId },
    data: { status: "po", vendorId, poNo: await nextPoNo(), value: q?.price ?? r.value },
  });
  revalidatePath("/procurement");
  return { ok: true };
}

export async function advanceRequirement(id: string) {
  await authorize("procurement.manage");
  const r = await prisma.materialReq.findUnique({ where: { id } });
  if (!r) return { ok: false };
  const idx = REQ_ORDER.indexOf(r.status);
  if (idx < 0 || idx >= REQ_ORDER.length - 1) return { ok: false };
  const next = REQ_ORDER[idx + 1];
  const data: { status: string; poNo?: string } = { status: next };

  if (next === "po" && !r.poNo) {
    const withPo = await prisma.materialReq.findMany({ where: { poNo: { not: null } }, select: { poNo: true } });
    const maxN = withPo.reduce((m: number, x: { poNo: string | null }) => {
      const n = parseInt((x.poNo || "").split("-").pop() || "0", 10);
      return Math.max(m, Number.isNaN(n) ? 0 : n);
    }, 4400);
    data.poNo = `PO-${maxN + 1}`;
  }

  await prisma.materialReq.update({ where: { id }, data });
  revalidatePath("/procurement");
  return { ok: true, status: next };
}

/* ---------------- Manufacturing ---------------- */

export async function advanceWorkOrder(id: string) {
  await authorize("manufacturing.manage");
  const w = await prisma.workOrder.findUnique({ where: { id } });
  if (!w) return { ok: false };
  let progress = Math.min(100, w.progress + 25);
  let status = "in-progress";
  if (progress >= 100) { progress = 100; status = "done"; }
  await prisma.workOrder.update({ where: { id }, data: { progress, status } });
  revalidatePath("/manufacturing");
  return { ok: true, progress, status };
}

export async function toggleWorkOrderHold(id: string) {
  await authorize("manufacturing.manage");
  const w = await prisma.workOrder.findUnique({ where: { id } });
  if (!w) return { ok: false };
  const status = w.status === "hold"
    ? (w.progress >= 100 ? "done" : w.progress > 0 ? "in-progress" : "queued")
    : "hold";
  await prisma.workOrder.update({ where: { id }, data: { status } });
  revalidatePath("/manufacturing");
  return { ok: true, status };
}

/* ---------------- Testing ---------------- */

export async function recordTestResult(testRecordId: string, result: "pass" | "fail") {
  await authorize("testing.manage");
  const tr = await prisma.testRecord.findUnique({ where: { id: testRecordId } });
  if (!tr) return { ok: false };
  await prisma.testRecord.update({ where: { id: testRecordId }, data: { result } });

  const unit = await prisma.testUnit.findUnique({ where: { id: tr.testUnitId }, include: { tests: true } });
  if (unit) {
    const others = unit.tests.filter((t: { id: string }) => t.id !== testRecordId);
    const anyPending = others.some((t: { result: string }) => t.result === "pending");
    const anyFail = result === "fail" || others.some((t: { result: string }) => t.result === "fail");
    if (!anyPending && !anyFail && !unit.certIssued) {
      await prisma.testUnit.update({ where: { id: unit.id }, data: { certIssued: true, issuedAt: today() } });
    } else if ((anyPending || anyFail) && unit.certIssued) {
      await prisma.testUnit.update({ where: { id: unit.id }, data: { certIssued: false, issuedAt: null } });
    }
  }
  revalidatePath("/testing");
  return { ok: true };
}

/* ---------------- Auto-generation ---------------- */

const shortOf = (title: string) => title.split(/[ —–-]+/)[0] || "UNIT";
const numOf = (id: string) => id.split("-").pop() ?? "0000";
const qtyOf = (s: string) => { const m = s.match(/^(\d+)\s*[×x]/); return m ? Number(m[1]) : 1; };

const PROD_PLAN = [
  { stage: "core", label: "Core Building", machine: "Core Cutting Line CL-1" },
  { stage: "winding", label: "Winding", machine: "Winding Machine WM-1" },
  { stage: "tank", label: "Tank Fabrication", machine: "Tank Fab Bay B1" },
  { stage: "assembly", label: "Assembly", machine: "Assembly Bay A1" },
];

/** Explode a project into its standard manufacturing work orders (one set per unit). */
export async function generateWorkOrders(projectId: string) {
  await authorize("manufacturing.manage");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, reason: "no-project" };
  if ((await prisma.workOrder.count({ where: { projectId } })) > 0) return { ok: false, reason: "exists" };

  const num = numOf(projectId);
  const short = shortOf(project.title);
  const qty = qtyOf(project.productSummary);
  const data = [];
  for (let u = 1; u <= qty; u++) {
    for (const s of PROD_PLAN) {
      data.push({
        id: `WO-${num}-U${u}-${s.stage.slice(0, 3).toUpperCase()}`, tenantId: project.tenantId, projectId,
        projectShort: short, unit: `Unit ${u} — ${s.label}`, stage: s.stage, operator: "Unassigned",
        machine: s.machine, startedAt: today(), progress: 0, status: "queued",
      });
    }
  }
  await prisma.workOrder.createMany({ data });
  revalidatePath("/manufacturing");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, count: data.length };
}

const ROUTINE_TESTS = [
  { name: "Winding resistance measurement", limit: "±2%" },
  { name: "Voltage ratio & polarity", limit: "±0.5%" },
  { name: "No-load loss & current", limit: "per datasheet" },
  { name: "Load loss & impedance voltage", limit: "per datasheet" },
  { name: "Insulation resistance (IR/PI)", limit: "≥ 1 GΩ" },
  { name: "Separate-source voltage withstand", limit: "withstood" },
  { name: "Induced overvoltage withstand", limit: "withstood" },
  { name: "Oil dielectric strength (BDV)", limit: "≥ 60 kV" },
];
const TYPE_TESTS = [
  { name: "Temperature-rise test", limit: "≤ 55 / 60 °C" },
  { name: "Lightning impulse (LI) test", limit: "per BIL" },
];

/** Generate a routine + type test plan (pending) for a project unit. */
export async function generateTestPlan(projectId: string) {
  const user = await authorize("testing.manage");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, reason: "no-project" };
  const serial = `CTR/2026/${numOf(projectId)}/${Date.now().toString().slice(-3)}`;
  await prisma.testUnit.create({
    data: {
      tenantId: project.tenantId, projectId, serial, projectShort: shortOf(project.title),
      product: project.productSummary, certIssued: false,
      tests: {
        create: [
          ...ROUTINE_TESTS.map((t) => ({ name: t.name, category: "routine", result: "pending", limit: t.limit, engineerId: user.id, witnessed: true })),
          ...TYPE_TESTS.map((t) => ({ name: t.name, category: "type", result: "pending", limit: t.limit, engineerId: user.id, witnessed: true })),
        ],
      },
    },
  });
  revalidatePath("/testing");
  return { ok: true, serial };
}
