"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- Procurement ---------------- */

const REQ_ORDER = ["required", "rfq", "po", "received"];

export async function advanceRequirement(id: string) {
  const r = await prisma.materialReq.findUnique({ where: { id } });
  if (!r) return { ok: false };
  const idx = REQ_ORDER.indexOf(r.status);
  if (idx < 0 || idx >= REQ_ORDER.length - 1) return { ok: false };
  const next = REQ_ORDER[idx + 1];
  const data: { status: string; poNo?: string } = { status: next };

  if (next === "po" && !r.poNo) {
    const withPo = await prisma.materialReq.findMany({ where: { poNo: { not: null } }, select: { poNo: true } });
    const maxN = withPo.reduce((m, x) => {
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
  const tr = await prisma.testRecord.findUnique({ where: { id: testRecordId } });
  if (!tr) return { ok: false };
  await prisma.testRecord.update({ where: { id: testRecordId }, data: { result } });

  const unit = await prisma.testUnit.findUnique({ where: { id: tr.testUnitId }, include: { tests: true } });
  if (unit) {
    const others = unit.tests.filter((t) => t.id !== testRecordId);
    const anyPending = others.some((t) => t.result === "pending");
    const anyFail = result === "fail" || others.some((t) => t.result === "fail");
    if (!anyPending && !anyFail && !unit.certIssued) {
      await prisma.testUnit.update({ where: { id: unit.id }, data: { certIssued: true, issuedAt: today() } });
    } else if ((anyPending || anyFail) && unit.certIssued) {
      await prisma.testUnit.update({ where: { id: unit.id }, data: { certIssued: false, issuedAt: null } });
    }
  }
  revalidatePath("/testing");
  return { ok: true };
}
