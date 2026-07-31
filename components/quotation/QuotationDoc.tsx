"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setQuotationStatus, reviseQuotation, saveQuotationBlocks, setApprovalStatus } from "@/app/actions/quotations";
import {
  ArrowLeft, Check, Clock, Download, GripVertical, FileText, Layers, X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { money, shortDate } from "@/lib/format";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { complianceTone, titleCase } from "@/lib/status";
import type { QuoteBlockType } from "@/lib/types";

const full = (n: number) => money({ amount: n, currency: "INR" }, { compact: false });

export interface QuoteVM {
  id: string;
  projectId: string;
  projectTitle: string;
  revision: number;
  status: string;
  validityDays: number;
  updatedAt: string;
  customerName: string;
  customerCity: string;
  ownerName: string;
  ownerInitials: string;
  product: string;
  standards: string;
  lineItems: { desc: string; qty: number; unit: string; unitPrice: number; amount: number; optional?: boolean }[];
  packing: number; freight: number; insurance: number; gstPct: number;
  subtotal: number; taxable: number; gst: number; grandTotal: number;
  paymentTerms: string; deliveryWeeks: number;
  scope: string[]; exclusions: string[];
  terms: { label: string; value: string }[];
  blocks: { type: QuoteBlockType; title: string; included: boolean }[];
  revisions: { rev: number; date: string; authorName: string; change: string }[];
  approvals: { role: string; userName: string; userInitials: string; status: string; date?: string }[];
  compliance: { total: number; comply: number; deviate: number; note: number; flagged: { clause: string; requirement: string; companySpec: string; status: "comply" | "deviate" | "note" | "not-applicable"; deviation?: string }[] };
}

export function QuotationDoc({ vm, canApprove = false }: { vm: QuoteVM; canApprove?: boolean }) {
  const [on, setOn] = useState<Set<QuoteBlockType>>(new Set(vm.blocks.filter((b) => b.included).map((b) => b.type)));
  const toggle = (t: QuoteBlockType) => setOn((prev) => {
    const n = new Set(prev);
    n.has(t) ? n.delete(t) : n.add(t);
    return n;
  });
  const has = (t: QuoteBlockType) => on.has(t);
  // deterministic section numbers (no render-time mutation → no hydration mismatch)
  const order = vm.blocks.filter((b) => on.has(b.type)).map((b) => b.type);
  const N = (t: QuoteBlockType) => (
    <span className="mr-2 tnum font-mono text-brand">{String(order.indexOf(t) + 1).padStart(2, "0")}</span>
  );

  const router = useRouter();
  const [busy, startTx] = useTransition();
  const setStatus = (s: string) => startTx(async () => { await setQuotationStatus(vm.projectId, s); router.refresh(); });
  const revise = () => startTx(async () => { await reviseQuotation(vm.projectId, `Revised to R${vm.revision + 1}.`); router.refresh(); });
  const orig = new Set(vm.blocks.filter((b) => b.included).map((b) => b.type));
  const layoutDirty = on.size !== orig.size || [...on].some((t) => !orig.has(t));
  const saveLayout = () => startTx(async () => {
    await saveQuotationBlocks(vm.projectId, vm.blocks.map((b) => ({ type: b.type, title: b.title, included: on.has(b.type) })));
    router.refresh();
  });
  const approve = (role: string, status: "approved" | "rejected") => startTx(async () => {
    await setApprovalStatus(vm.projectId, role, status);
    router.refresh();
  });

  const STATUS_CLS: Record<string, string> = { draft: "bg-neutral-soft text-ink-3", issued: "bg-brand-soft text-brand", won: "bg-ok-soft text-ok", lost: "bg-danger-soft text-danger", revised: "bg-warn-soft text-warn" };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/quotations`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-brand">
          <ArrowLeft className="h-3.5 w-3.5" /> Quotations
        </Link>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", STATUS_CLS[vm.status] ?? "bg-surface-3 text-ink-3")}>{vm.status}</span>
          {vm.status === "draft" && (
            <StatusBtn onClick={() => setStatus("issued")} busy={busy} primary>Issue</StatusBtn>
          )}
          {(vm.status === "issued" || vm.status === "revised") && (
            <>
              <StatusBtn onClick={() => setStatus("won")} busy={busy} tone="ok">Mark won</StatusBtn>
              <StatusBtn onClick={() => setStatus("lost")} busy={busy} tone="danger">Mark lost</StatusBtn>
            </>
          )}
          <StatusBtn onClick={revise} busy={busy}>+ Revise</StatusBtn>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr] print:block">
        {/* Left rail */}
        <div className="space-y-4 lg:sticky lg:top-[76px] lg:self-start print:hidden">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-1.5 border-b border-line-2 px-4 py-3 text-[12.5px] font-bold text-ink">
              <Layers className="h-4 w-4 text-ink-3" /> Document blocks
              <span className="ml-auto tnum font-mono text-[11px] font-normal text-ink-4">{on.size}/{vm.blocks.length}</span>
            </div>
            <div className="p-2">
              {vm.blocks.map((b) => (
                <button key={b.type} onClick={() => toggle(b.type)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", has(b.type) ? "border-brand bg-brand text-white" : "border-line-strong bg-surface")}>
                    {has(b.type) && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className={cn("flex-1 text-[12.5px]", has(b.type) ? "font-medium text-ink" : "text-ink-4")}>{b.title}</span>
                  <GripVertical className="h-3.5 w-3.5 text-line-strong" />
                </button>
              ))}
            </div>
            <div className="space-y-2 border-t border-line-2 p-3">
              {layoutDirty && (
                <button onClick={saveLayout} disabled={busy}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-line bg-brand-soft px-3 py-2 text-[12.5px] font-semibold text-brand-ink transition-colors hover:bg-brand-soft/70 disabled:opacity-50">
                  <Check className="h-4 w-4" /> {busy ? "Saving…" : "Save layout"}
                </button>
              )}
              <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink">
                <Download className="h-4 w-4" /> Generate PDF
              </button>
            </div>
          </div>

          {/* Approval chain */}
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
            <div className="border-b border-line-2 px-4 py-3 text-[12.5px] font-bold text-ink">Approval chain</div>
            <div className="space-y-0.5 p-3">
              {vm.approvals.map((a) => {
                const rejected = a.status === "rejected";
                const approved = a.status === "approved";
                return (
                  <div key={a.role} className="flex items-center gap-2.5 py-1.5">
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", approved ? "bg-ok text-white" : rejected ? "bg-danger text-white" : "bg-surface-3 text-ink-4")}>
                      {approved ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : rejected ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : <Clock className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-ink">{a.role}</div>
                      <div className="truncate text-[10.5px] text-ink-4">{a.userName}{a.date ? ` · ${shortDate(a.date)}` : rejected ? " · rejected" : " · pending"}</div>
                    </div>
                    {canApprove && !approved && (
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => approve(a.role, "approved")} disabled={busy} title="Approve"
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-ok-soft text-ok hover:bg-ok hover:text-white disabled:opacity-40"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => approve(a.role, "rejected")} disabled={busy} title="Reject"
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-danger-soft text-danger hover:bg-danger hover:text-white disabled:opacity-40"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {canApprove && <div className="border-t border-line-2 px-3 py-2 text-[10.5px] text-ink-4">All steps approved → auto-issues. Any rejection → back to draft.</div>}
          </div>
        </div>

        {/* Document */}
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
          {/* Letterhead */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink px-6 py-5">
            <div>
              <div className="text-[17px] font-extrabold tracking-tight text-ink">CANDRON Electricals Pvt. Ltd.</div>
              <div className="text-[11px] text-ink-3">Transformers & Switchgear · Nagpur, India · GSTIN 27AAECC1234A1Z5</div>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-ink-4">Quotation</div>
              <Mono className="text-[14px] font-semibold text-ink">{vm.id}</Mono>
              <div className="mt-0.5 text-[11px] text-ink-3">Rev {vm.revision} · {shortDate(vm.updatedAt)} · valid {vm.validityDays}d</div>
            </div>
          </div>

          <div className="space-y-7 px-6 py-6">
            {/* To / project */}
            <div className="flex flex-wrap justify-between gap-4 text-[12.5px]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-4">To</div>
                <div className="font-semibold text-ink">{vm.customerName}</div>
                <div className="text-ink-3">{vm.customerCity}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-4">Project</div>
                <div className="font-semibold text-ink">{vm.projectTitle}</div>
                <Mono className="text-ink-3">{vm.projectId}</Mono>
              </div>
            </div>

            {has("cover-letter") && (
              <Section title={<>{N("cover-letter")}Cover Letter</>}>
                <p className="text-[12.5px] leading-relaxed text-ink-2">
                  Dear Sir/Madam, thank you for the opportunity to quote for <b className="text-ink">{vm.product}</b>. We are pleased to submit
                  our technical and commercial offer, designed and manufactured to {vm.standards}. Our offer is valid for {vm.validityDays} days.
                  We remain at your disposal for any clarification.
                </p>
              </Section>
            )}

            {has("commercial-offer") && (
              <Section title={<>{N("commercial-offer")}Commercial Offer</>}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-line text-left text-[10.5px] font-bold uppercase tracking-wide text-ink-4">
                        <th className="py-2 pr-2 font-bold">Description</th>
                        <th className="px-2 py-2 text-right font-bold">Qty</th>
                        <th className="px-2 py-2 text-right font-bold">Unit price</th>
                        <th className="py-2 pl-2 text-right font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-2">
                      {vm.lineItems.map((l, i) => (
                        <tr key={i} className={l.optional ? "text-ink-3" : "text-ink-2"}>
                          <td className="py-2 pr-2">{l.desc}{l.optional && <span className="ml-1.5 rounded bg-surface-3 px-1 py-px text-[9.5px] font-semibold uppercase text-ink-4">optional</span>}</td>
                          <td className="px-2 py-2 text-right tnum font-mono">{l.qty} {l.unit}</td>
                          <td className="px-2 py-2 text-right tnum font-mono">{full(l.unitPrice)}</td>
                          <td className="py-2 pl-2 text-right tnum font-mono font-semibold text-ink">{full(l.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 ml-auto max-w-xs space-y-1 text-[12px]">
                  <TotRow label="Sub-total (ex-works)" value={full(vm.subtotal)} />
                  <TotRow label="Packing" value={full(vm.packing)} />
                  <TotRow label="Freight" value={full(vm.freight)} />
                  <TotRow label="Insurance" value={full(vm.insurance)} />
                  <TotRow label={`GST @ ${vm.gstPct}%`} value={full(vm.gst)} />
                  <div className="flex items-center justify-between border-t border-ink pt-1.5 text-[13.5px] font-bold text-ink">
                    <span>Grand Total</span><span className="tnum font-mono">{full(vm.grandTotal)}</span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-ink-4">Optional items are not included in the grand total. Payment: {vm.paymentTerms}.</p>
              </Section>
            )}

            {has("technical-offer") && (
              <Section title={<>{N("technical-offer")}Technical Offer</>}>
                <div className="grid gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-2">
                  <Spec label="Product" value={vm.product} />
                  <Spec label="Standards" value={vm.standards} />
                  <Spec label="Cooling" value="ONAN / ONAF as configured" />
                  <Spec label="Insulation" value="Class A, mineral oil (IS 335)" />
                  <Spec label="Protection" value="Buchholz · PRV · OTI · WTI · MOG" />
                  <Spec label="Testing" value="Routine + type per IS 2026 / IEC 60076" />
                </div>
              </Section>
            )}

            {has("compliance-matrix") && (
              <Section title={<>{N("compliance-matrix")}Compliance Matrix</>}>
                <div className="mb-2.5 flex flex-wrap gap-2 text-[11.5px]">
                  <Badge tone={complianceTone.comply} dot>{vm.compliance.comply} comply</Badge>
                  {vm.compliance.deviate > 0 && <Badge tone={complianceTone.deviate} dot>{vm.compliance.deviate} deviate</Badge>}
                  {vm.compliance.note > 0 && <Badge tone={complianceTone.note} dot>{vm.compliance.note} notes</Badge>}
                  <span className="text-ink-4">of {vm.compliance.total} clauses</span>
                </div>
                {vm.compliance.flagged.length > 0 ? (
                  <div className="divide-y divide-line-2 rounded-lg border border-line-2">
                    {vm.compliance.flagged.map((r) => (
                      <div key={r.clause} className="flex items-start gap-2 px-3 py-2 text-[12px]">
                        <span className="tnum w-8 shrink-0 font-mono text-ink-4">{r.clause}</span>
                        <span className="min-w-0 flex-1 text-ink-2">{r.requirement}{r.deviation && <span className="text-warn"> — Δ {r.deviation}</span>}</span>
                        <Badge tone={complianceTone[r.status]}>{titleCase(r.status)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[12px] text-ink-3">Full compliance with all tender clauses.</p>}
              </Section>
            )}

            {has("scope") && (
              <Section title={<>{N("scope")}Scope of Supply</>}><Bullets items={vm.scope} /></Section>
            )}
            {has("exclusions") && (
              <Section title={<>{N("exclusions")}Exclusions</>}><Bullets items={vm.exclusions} muted /></Section>
            )}
            {has("drawings") && (
              <Section title={<>{N("drawings")}Drawings & Datasheets</>}>
                <div className="flex flex-wrap gap-2">
                  {["GA Drawing", "Single Line Diagram", "Rating & Diagram Plate", "Technical Datasheet", "Test Certificates"].map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 rounded-lg border border-line-2 bg-surface-2 px-2.5 py-1 text-[11.5px] text-ink-2"><FileText className="h-3 w-3 text-ink-4" />{d}</span>
                  ))}
                </div>
              </Section>
            )}
            {has("commercial-terms") && (
              <Section title={<>{N("commercial-terms")}Commercial Terms</>}>
                <div className="grid gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-2">
                  {vm.terms.map((t) => <Spec key={t.label} label={t.label} value={t.value} />)}
                </div>
              </Section>
            )}
            {has("revision-history") && (
              <Section title={<>{N("revision-history")}Revision History</>}>
                <div className="divide-y divide-line-2 rounded-lg border border-line-2">
                  {vm.revisions.map((r) => (
                    <div key={r.rev} className="flex items-center gap-3 px-3 py-2 text-[12px]">
                      <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-3">R{r.rev}</span>
                      <span className="w-24 shrink-0 text-ink-4">{shortDate(r.date)}</span>
                      <span className="flex-1 text-ink-2">{r.change}</span>
                      <span className="text-ink-4">{r.authorName}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBtn({ onClick, busy, children, primary, tone }: { onClick: () => void; busy: boolean; children: React.ReactNode; primary?: boolean; tone?: "ok" | "danger" }) {
  const styles = primary
    ? "bg-brand text-white hover:bg-brand-ink border-transparent"
    : tone === "ok"
    ? "border-ok/30 bg-ok-soft text-ok hover:bg-ok hover:text-white"
    : tone === "danger"
    ? "border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white"
    : "border-line bg-surface text-ink-2 hover:bg-surface-3";
  return (
    <button onClick={onClick} disabled={busy}
      className={cn("rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition-colors disabled:opacity-50", styles)}>
      {children}
    </button>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 flex items-center border-b border-line-2 pb-1.5 text-[13px] font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}
function TotRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-ink-3">{label}</span><span className="tnum font-mono text-ink-2">{value}</span></div>;
}
function Spec({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 border-b border-line-2 py-1"><span className="text-ink-4">{label}</span><span className="text-right font-medium text-ink">{value}</span></div>;
}
function Bullets({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {items.map((it) => (
        <li key={it} className={cn("flex items-start gap-2 text-[12.5px]", muted ? "text-ink-3" : "text-ink-2")}>
          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", muted ? "bg-ink-4" : "bg-brand")} />{it}
        </li>
      ))}
    </ul>
  );
}
