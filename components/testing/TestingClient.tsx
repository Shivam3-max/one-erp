"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CheckCircle2, XCircle, Clock, BadgeCheck, Eye, PenLine, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { shortDate } from "@/lib/format";
import { Mono } from "@/components/ui/Badge";
import { CAT_LABEL, type TestCat, type TestResult, type TestUnit } from "@/lib/mock/testing";
import { recordTestResult } from "@/app/actions/execution";

type Lite = { name: string; initials: string };

const RESULT: Record<TestResult, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  pass: { icon: CheckCircle2, color: "text-ok", bg: "bg-ok-soft" },
  fail: { icon: XCircle, color: "text-danger", bg: "bg-danger-soft" },
  pending: { icon: Clock, color: "text-ink-4", bg: "bg-neutral-soft" },
};

export function TestingClient({ units, users }: { units: TestUnit[]; users: Record<string, Lite> }) {
  const [serial, setSerial] = useState(units[0]?.serial ?? "");
  const unit = units.find((u) => u.serial === serial) ?? units[0];
  const router = useRouter();
  const [saving, start] = useTransition();
  const record = (id: string, result: "pass" | "fail") => start(async () => { await recordTestResult(id, result); router.refresh(); });

  const passed = unit.tests.filter((t) => t.result === "pass").length;
  const pending = unit.tests.filter((t) => t.result === "pending").length;
  const total = unit.tests.length;
  const passRate = total - pending ? Math.round((passed / (total - pending)) * 100) : 0;
  const cats: TestCat[] = ["routine", "type", "special"];

  return (
    <div className="space-y-4">
      {/* unit selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select value={serial} onChange={(e) => setSerial(e.target.value)}
            className="appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-9 text-[13px] font-semibold text-ink outline-none focus:border-brand-line">
            {units.map((u) => <option key={u.serial} value={u.serial}>{u.serial} · {u.projectShort}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        </div>
        <span className="text-[13px] text-ink-3">{unit.product}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Test records */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <MiniKPI label="Passed" value={`${passed}/${total}`} tone="ok" />
            <MiniKPI label="Pending" value={String(pending)} tone={pending ? "warn" : "ok"} />
            <MiniKPI label="Pass rate" value={`${passRate}%`} tone="brand" />
          </div>

          {unit.tests.some((t) => t.result === "fail") && (
            <div className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft/40 p-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-danger"><XCircle className="h-4 w-4" /> Non-conformances (NCR)</div>
              <ul className="mt-2 space-y-1.5">
                {unit.tests.filter((t) => t.result === "fail").map((t) => (
                  <li key={t.id} className="flex items-start gap-2 text-[12px] text-ink-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    <span><b className="text-ink">{t.name}</b> failed{t.limit ? ` (limit ${t.limit})` : ""} — CAPA required before the certificate can issue.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cats.map((cat) => {
            const tests = unit.tests.filter((t) => t.category === cat);
            if (!tests.length) return null;
            return (
              <div key={cat} className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
                <div className="border-b border-line-2 bg-surface-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-4">{CAT_LABEL[cat]} tests</div>
                <div className="divide-y divide-line-2">
                  {tests.map((t) => {
                    const R = RESULT[t.result];
                    const Icon = R.icon;
                    const eng = users[t.engineerId];
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                        <Icon className={cn("h-4 w-4 shrink-0", R.color)} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-ink">{t.name}</div>
                          <div className="text-[11px] text-ink-3">
                            {t.value ? <span className="tnum font-mono text-ink-2">{t.value}</span> : <span className="italic">not yet run</span>}
                            {t.limit && <span className="text-ink-4"> · limit {t.limit}</span>}
                          </div>
                        </div>
                        {t.witnessed && <span title="Client witnessed" className="text-ink-4"><Eye className="h-3.5 w-3.5" /></span>}
                        {t.result === "pending" ? (
                          <div className="flex gap-1">
                            <button onClick={() => record(t.id, "pass")} disabled={saving} className="rounded-md bg-ok-soft px-2 py-0.5 text-[10.5px] font-bold text-ok transition-colors hover:bg-ok hover:text-white disabled:opacity-40">Pass</button>
                            <button onClick={() => record(t.id, "fail")} disabled={saving} className="rounded-md bg-danger-soft px-2 py-0.5 text-[10.5px] font-bold text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-40">Fail</button>
                          </div>
                        ) : (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-bold capitalize", R.bg, R.color)}>{t.result}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Certificate */}
        <div>
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
            <div className="border-b border-line-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <BadgeCheck className={cn("h-5 w-5", unit.certIssued ? "text-ok" : "text-ink-4")} />
                <span className="text-[13px] font-bold text-ink">Test Certificate</span>
              </div>
            </div>
            <div className="p-4">
              <div className="rounded-xl border-2 border-dashed border-line p-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-4">Certificate No.</div>
                <Mono className="text-[14px] font-semibold text-ink">{unit.serial}</Mono>
                <div className="mt-1 text-[11.5px] text-ink-3">{unit.product}</div>
                <div className="my-3 h-px bg-line-2" />
                {unit.certIssued ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-[12px] font-bold text-ok">
                      <ShieldCheck className="h-4 w-4" /> Issued
                    </div>
                    <div className="mt-2 text-[11px] text-ink-3">All {total} tests passed · {shortDate(unit.issuedAt)}</div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-[12px] font-bold text-warn">
                      <Clock className="h-4 w-4" /> {pending} test{pending > 1 ? "s" : ""} pending
                    </div>
                    <div className="mt-2 text-[11px] text-ink-3">{passed}/{total} complete — certificate auto-issues on completion.</div>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-2 text-[12px]">
                <Row label="Serial number" value={unit.serial.split("/").pop()!} />
                <Row label="Calibration cert." value="Valid — NABL 2026" />
                <Row label="Client witness" value={unit.tests.some((t) => t.witnessed) ? "Yes" : "No"} />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
                <PenLine className="h-4 w-4 text-brand" />
                <div className="text-[11.5px] leading-tight">
                  <div className="font-semibold text-ink">Digital signature</div>
                  <div className="text-ink-3">A. Kumar, Testing Engineer · CANDRON QA</div>
                </div>
              </div>
              <button disabled={!unit.certIssued}
                className="mt-3 w-full rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40">
                {unit.certIssued ? "Download certificate" : "Awaiting test completion"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "brand" }) {
  const c = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-brand";
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-3 text-center shadow-[var(--shadow-card)]">
      <div className={cn("tnum font-mono text-[20px] font-semibold", c)}>{value}</div>
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-4">{label}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-ink-3">{label}</span><span className="font-medium text-ink">{value}</span></div>;
}
