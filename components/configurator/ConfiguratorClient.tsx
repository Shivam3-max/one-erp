"use client";

import { useMemo, useState } from "react";
import {
  Boxes, Calculator, FileText, CheckCircle2, TriangleAlert, Info,
  Cpu, ArrowRight, Save, Sparkles, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { FAMILIES } from "@/lib/configurator/families";
import {
  initValues, computeCost, attrCount, rateOf, RATE_CARD_DATE,
  type Values, type AttrDef, type FamilyDef,
} from "@/lib/configurator/model";
import { SaveToProjectButton } from "./SaveToProjectButton";

const inr = (n: number) => money({ amount: Math.round(n), currency: "INR" });

export function ConfiguratorClient({ projects }: { projects: { id: string; title: string }[] }) {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id);
  const family = FAMILIES.find((f) => f.id === familyId)!;
  const [values, setValues] = useState<Values>(() => initValues(FAMILIES[0]));
  const [margin, setMargin] = useState(18);

  const changeFamily = (f: FamilyDef) => {
    setFamilyId(f.id);
    setValues(initValues(f));
    setMargin(18);
  };
  const set = (id: string, v: string | number | boolean) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  // zero-out hidden attributes so they don't leak into BOM/cost
  const effective = useMemo(() => {
    const e: Values = { ...values };
    for (const g of family.groups)
      for (const a of g.attributes)
        if (a.visibleIf && !a.visibleIf(values)) e[a.id] = a.default;
    return e;
  }, [values, family]);

  const derived = useMemo(() => family.derive(effective), [family, effective]);
  const issues = useMemo(() => family.validate(effective, derived), [family, effective, derived]);
  const bom = useMemo(() => family.emitBom(effective, derived), [family, effective, derived]);
  const cost = useMemo(() => computeCost(bom, effective, margin), [bom, effective, margin]);
  const sheet = useMemo(() => family.datasheet(effective, derived), [family, effective, derived]);

  const errors = issues.filter((i) => i.level === "error");
  const specCount = sheet.reduce((s, g) => s + g.rows.length, 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px]">
      {/* ---------------- FORM ---------------- */}
      <div className="min-w-0 space-y-4">
        {/* Family switcher */}
        <div className="flex flex-wrap gap-2">
          {FAMILIES.map((f) => {
            const active = f.id === familyId;
            return (
              <button
                key={f.id}
                onClick={() => changeFamily(f)}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  active ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-surface-2"
                )}
              >
                <span className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-brand text-white" : "bg-surface-3 text-ink-3")}>
                  <Cpu className="h-4 w-4" />
                </span>
                <span>
                  <span className={cn("block text-[13px] font-bold", active ? "text-brand-ink" : "text-ink")}>{f.name}</span>
                  <span className="block text-[11px] text-ink-3">{f.category} · {attrCount(f)} attributes</span>
                </span>
              </button>
            );
          })}
        </div>

        {family.groups.map((g) => (
          <div key={g.id} className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
            <div className="border-b border-line-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-4">
              {g.label}
            </div>
            <div className="grid gap-x-5 gap-y-3.5 p-4 sm:grid-cols-2">
              {g.attributes.map((a) =>
                a.visibleIf && !a.visibleIf(values) ? null : (
                  <Field key={a.id} attr={a} value={values[a.id]} onChange={(v) => set(a.id, v)} />
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- OUTPUTS ---------------- */}
      <div className="lg:sticky lg:top-[76px] lg:self-start">
        <div className="max-h-[calc(100vh-92px)] space-y-3 overflow-y-auto pr-0.5">
          {/* Compiler strip */}
          <div className="rounded-[var(--radius-lg)] border border-line bg-ink p-4 text-white shadow-[var(--shadow-pop)]">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
              <Sparkles className="h-3.5 w-3.5" /> Configuration compiles to
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <OutTile icon={Boxes} value={String(bom.length)} label="BOM lines" />
              <OutTile icon={Calculator} value={inr(cost.estimatedCost)} label="Est. cost" small />
              <OutTile icon={FileText} value={String(specCount)} label="Datasheet" />
            </div>
          </div>

          {/* Price card */}
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-4">Selling price</span>
              <span className="tnum rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">{cost.marginPct}% margin</span>
            </div>
            <div className="mt-1.5 tnum font-mono text-[30px] font-semibold leading-none tracking-tight text-ink">
              {inr(cost.sellingPrice)}
            </div>
            <div className="mt-1 text-[11.5px] text-ink-3">
              {cost.quantity > 1 ? `${cost.quantity} units · ` : ""}Est. cost {inr(cost.estimatedCost)} · contribution {inr(cost.contribution)}
            </div>

            <div className="mt-3">
              <input
                type="range" min={8} max={35} step={0.5} value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full accent-[var(--color-brand)]"
              />
              <div className="flex justify-between text-[10px] text-ink-4"><span>8%</span><span>margin</span><span>35%</span></div>
            </div>

            <div className="mt-3 space-y-1.5 border-t border-line-2 pt-3">
              <CostRow label="Material" amount={cost.material} />
              <CostRow label="Labour (14%)" amount={cost.labour} />
              <CostRow label="Overhead (9%)" amount={cost.overhead} />
              <CostRow label="Testing" amount={cost.testing} />
              <CostRow label="Packing · freight · insurance" amount={cost.logistics} />
            </div>
            <div className="mt-1.5 text-right text-[10px] text-ink-4">rate card {RATE_CARD_DATE}</div>
          </div>

          {/* Validation */}
          <div className={cn(
            "rounded-[var(--radius-lg)] border p-3.5 shadow-[var(--shadow-card)]",
            errors.length ? "border-danger/25 bg-danger-soft/40" : issues.length ? "border-line bg-surface" : "border-ok/25 bg-ok-soft/40"
          )}>
            <div className="flex items-center gap-2">
              {errors.length ? <TriangleAlert className="h-4 w-4 text-danger" /> : <CheckCircle2 className="h-4 w-4 text-ok" />}
              <span className="text-[12.5px] font-bold text-ink">
                {errors.length ? `${errors.length} issue${errors.length > 1 ? "s" : ""} to resolve` : issues.length ? "Valid — with notes" : "All checks passed"}
              </span>
            </div>
            {issues.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {issues.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11.5px] text-ink-2">
                    {i.level === "error" ? <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-danger" />
                      : i.level === "warn" ? <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-warn" />
                      : <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand" />}
                    {i.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* BOM */}
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-line-2 px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink"><Boxes className="h-4 w-4 text-ink-3" /> Bill of Material</span>
              <span className="tnum font-mono text-[11px] text-ink-4">{bom.length} lines · {inr(cost.material)}</span>
            </div>
            <div className="max-h-64 divide-y divide-line-2 overflow-y-auto">
              {bom.map((l) => (
                <div key={l.key} className="flex items-center gap-2 px-4 py-2">
                  <span className="w-16 shrink-0 truncate rounded bg-surface-3 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">{l.category}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{l.description}</span>
                  <span className="tnum shrink-0 font-mono text-[11px] text-ink-3">{l.qty.toLocaleString("en-IN")} {l.unit}</span>
                  <span className="tnum w-16 shrink-0 text-right font-mono text-[11.5px] font-semibold text-ink">{inr(l.qty * rateOf(l.rateKey))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Datasheet */}
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-1.5 border-b border-line-2 px-4 py-2.5 text-[12.5px] font-bold text-ink"><FileText className="h-4 w-4 text-ink-3" /> Datasheet preview</div>
            <div className="space-y-3 p-4">
              {sheet.map((grp) => (
                <div key={grp.group}>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-4">{grp.group}</div>
                  <div className="space-y-1">
                    {grp.rows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between text-[12px]">
                        <span className="text-ink-3">{r.label}</span>
                        <span className="tnum font-mono font-medium text-ink">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <SaveToProjectButton
              projects={projects}
              disabled={errors.length > 0}
              payload={{
                familyId: family.id,
                familyName: family.name,
                values: effective,
                marginPct: margin,
                summary: `${derived.mva} MVA ${values.primaryVoltage}/${values.secondaryVoltage} kV ${values.cooling}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- helpers & subcomponents ---- */

function CostRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-ink-3">{label}</span>
      <span className="tnum font-mono text-ink-2">{inr(amount)}</span>
    </div>
  );
}

function OutTile({ icon: Icon, value, label, small }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string; small?: boolean }) {
  return (
    <div className="rounded-lg bg-white/10 px-2 py-2 text-center">
      <Icon className="mx-auto h-4 w-4 text-white/70" />
      <div className={cn("mt-1 tnum font-mono font-semibold text-white", small ? "text-[13px]" : "text-[17px]")}>{value}</div>
      <div className="text-[9.5px] font-medium uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}

function Field({ attr, value, onChange }: { attr: AttrDef; value: Values[string]; onChange: (v: string | number | boolean) => void }) {
  if (attr.type === "boolean") {
    const on = Boolean(value);
    return (
      <button onClick={() => onChange(!on)} className="flex items-center justify-between gap-2 rounded-lg border border-line-2 bg-surface-2 px-3 py-2 text-left transition-colors hover:bg-surface-3">
        <span className="text-[12.5px] font-medium text-ink-2">{attr.label}</span>
        <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-brand" : "bg-line-strong")}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all", on ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>
    );
  }

  const label = (
    <div className="mb-1 flex items-baseline justify-between">
      <span className="text-[12px] font-semibold text-ink-2">{attr.label}</span>
      {attr.unit && <span className="text-[10.5px] text-ink-4">{attr.unit}</span>}
    </div>
  );

  if (attr.type === "number") {
    return (
      <div>
        {label}
        <input
          type="number" value={Number(value)} min={attr.min} max={attr.max} step={attr.step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tnum w-full rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft"
        />
      </div>
    );
  }

  // enum
  const options = attr.options ?? [];
  if (options.length <= 3) {
    return (
      <div>
        {label}
        <div className="flex gap-1">
          {options.map((o) => (
            <button key={o.value} onClick={() => onChange(o.value)}
              className={cn(
                "flex-1 truncate rounded-lg border px-2 py-1.5 text-[12px] font-semibold transition-colors",
                value === o.value ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface text-ink-3 hover:bg-surface-2"
              )}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      {label}
      <div className="relative">
        <select value={String(value)} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-line bg-surface px-3 py-1.5 pr-8 text-[13px] font-medium text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
      </div>
    </div>
  );
}
