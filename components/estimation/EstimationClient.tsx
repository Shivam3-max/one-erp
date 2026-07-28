"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, TriangleAlert, CheckCircle2, Layers, History, Gauge } from "lucide-react";
import { cn } from "@/lib/cn";
import { money, shortDate } from "@/lib/format";
import { FAMILIES } from "@/lib/configurator/families";
import { initValues, computeCost, rateOf, type Values } from "@/lib/configurator/model";
import { similarBenchmarks, COMMODITIES, mean } from "@/lib/mock/estimation";

const inr = (n: number) => money({ amount: Math.round(n), currency: "INR" });
const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

export function EstimationClient() {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id);
  const family = FAMILIES.find((f) => f.id === familyId)!;
  const ratingOpts = family.groups[0].attributes[0].options!;
  const primOpts = family.groups[0].attributes[1].options!;
  const secOpts = family.groups[0].attributes[2].options!;

  const [rating, setRating] = useState(ratingOpts[Math.min(2, ratingOpts.length - 1)].value);
  const [primary, setPrimary] = useState(primOpts[Math.floor(primOpts.length / 2)].value);
  const [secondary, setSecondary] = useState(secOpts[Math.floor(secOpts.length / 2)].value);
  const [winding, setWinding] = useState("copper");
  const [qty, setQty] = useState(2);
  const [margin, setMargin] = useState(18);

  const values: Values = useMemo(() => ({
    ...initValues(family),
    powerRating: rating,
    primaryVoltage: primary,
    secondaryVoltage: secondary,
    windingMaterial: winding,
    quantity: qty,
  }), [family, rating, primary, secondary, winding, qty]);

  const derived = useMemo(() => family.derive(values), [family, values]);
  const bom = useMemo(() => family.emitBom(values, derived), [family, values, derived]);
  const cost = useMemo(() => computeCost(bom, values, margin), [bom, values, margin]);

  // cost drivers by category
  const drivers = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of bom) map.set(l.category, (map.get(l.category) ?? 0) + l.qty * rateOf(l.rateKey));
    return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [bom]);
  const driverMax = Math.max(...drivers.map((d) => d.amount), 1);

  // benchmark vs actuals — via historical OVERRUN (same scale as this estimate)
  const mva = Number(rating);
  const voltageClass = `${primary}/${secondary}`;
  const similar = similarBenchmarks(mva, voltageClass);
  const avgOverrun = mean(similar.map((b) => (b.actualPerUnit - b.estPerUnit) / b.estPerUnit));
  const sellingPerUnit = cost.sellingPrice / cost.quantity;
  const expectedCostPerUnit = cost.perUnit * (1 + avgOverrun);
  const realizedMargin = sellingPerUnit ? (sellingPerUnit - expectedCostPerUnit) / sellingPerUnit : 0;
  const thinMargin = realizedMargin < 0.1;

  // copper exposure
  const copperLine = bom.find((l) => l.rateKey === "copper");
  const copperKg = copperLine?.qty ?? 0;
  const copperSpot = COMMODITIES[0];
  const copperExposure = copperKg * (copperSpot.spotRate - copperSpot.cardRate);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left: basis + drivers */}
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-4">Estimate basis</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select label="Product family" value={familyId} onChange={(v) => { setFamilyId(v); }} options={FAMILIES.map((f) => ({ value: f.id, label: f.name }))} />
            <Select label="Rated power" value={rating} onChange={setRating} options={ratingOpts} />
            <div className="grid grid-cols-2 gap-2">
              <Select label="Primary" value={primary} onChange={setPrimary} options={primOpts} unit="kV" />
              <Select label="Secondary" value={secondary} onChange={setSecondary} options={secOpts} unit="kV" />
            </div>
            <Segmented label="Winding" value={winding} onChange={setWinding} options={[{ value: "copper", label: "Copper" }, { value: "aluminium", label: "Aluminium" }]} />
            <NumberField label="Quantity" value={qty} onChange={setQty} min={1} max={20} />
          </div>
        </div>

        {/* Cost drivers */}
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 border-b border-line-2 px-4 py-3 text-[13px] font-bold text-ink">
            <Layers className="h-4 w-4 text-ink-3" /> Cost drivers
            <span className="ml-auto tnum font-mono text-[11px] font-normal text-ink-4">material {inr(cost.material)}/unit</span>
          </div>
          <div className="space-y-2.5 p-4">
            {drivers.map((d) => (
              <div key={d.category} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-[12px] font-medium text-ink-2">{d.category}</div>
                <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-3">
                  <div className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-brand to-brand-2" style={{ width: `${Math.max((d.amount / driverMax) * 100, 4)}%` }} />
                </div>
                <div className="w-24 shrink-0 text-right tnum font-mono text-[12px] font-semibold text-ink">{inr(d.amount)}</div>
                <div className="w-12 shrink-0 text-right tnum font-mono text-[11px] text-ink-4">{((d.amount / cost.material) * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark vs actuals — the differentiator */}
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 border-b border-line-2 px-4 py-3 text-[13px] font-bold text-ink">
            <History className="h-4 w-4 text-ink-3" /> Benchmark against delivered units
            <span className="ml-auto tnum font-mono text-[11px] font-normal text-ink-4">{similar.length} similar · class {voltageClass} kV</span>
          </div>

          <div className={cn("mx-4 mt-4 flex items-start gap-2.5 rounded-lg border p-3", thinMargin ? "border-warn/25 bg-warn-soft/50" : "border-ok/25 bg-ok-soft/50")}>
            {thinMargin ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" />}
            <div className="text-[12.5px] leading-relaxed text-ink-2">
              Similar delivered units ran <b className="text-ink">{pct(avgOverrun)}</b> over their estimate. Applied to this estimate of <b className="text-ink">{inr(cost.perUnit)}/unit</b>, expected landed cost is <b className="text-ink">{inr(expectedCostPerUnit)}</b> —
              realized margin <b className={thinMargin ? "text-warn" : "text-ok"}>≈ {(realizedMargin * 100).toFixed(1)}%</b> against the quoted {margin}%.
              {thinMargin ? " Margin risk — add contingency or raise the quote." : " Cushion looks adequate."}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line-2 text-left text-[10.5px] font-bold uppercase tracking-wide text-ink-4">
                  <th className="px-4 py-2 font-bold">Project</th>
                  <th className="px-2 py-2 font-bold">Delivered</th>
                  <th className="px-2 py-2 text-right font-bold">Estimated</th>
                  <th className="px-2 py-2 text-right font-bold">Actual</th>
                  <th className="px-4 py-2 text-right font-bold">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {similar.map((b) => {
                  const v = (b.actualPerUnit - b.estPerUnit) / b.estPerUnit;
                  return (
                    <tr key={b.id}>
                      <td className="px-4 py-2.5">
                        <div className="font-mono text-[11px] font-semibold text-brand">{b.id}</div>
                        <div className="text-[11px] text-ink-3">{b.product}</div>
                      </td>
                      <td className="px-2 py-2.5 text-ink-3">{shortDate(b.deliveredAt)}</td>
                      <td className="px-2 py-2.5 text-right tnum font-mono text-ink-2">{inr(b.estPerUnit)}</td>
                      <td className="px-2 py-2.5 text-right tnum font-mono font-semibold text-ink">{inr(b.actualPerUnit)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn("tnum inline-flex items-center gap-0.5 font-mono font-semibold", v > 0.05 ? "text-danger" : v > 0 ? "text-warn" : "text-ok")}>
                          <TrendingUp className="h-3 w-3" />{pct(v)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-[11px] text-ink-4">Delivered units historically ran <b className="text-ink-2">{pct(mean(similar.map((b) => (b.actualPerUnit - b.estPerUnit) / b.estPerUnit)))}</b> over estimate — the model bakes this into risk.</div>
        </div>
      </div>

      {/* Right: summary + commodity */}
      <div className="space-y-4">
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-4">Selling price · total</span>
            <span className="tnum rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">{margin}% margin</span>
          </div>
          <div className="mt-1.5 tnum font-mono text-[28px] font-semibold leading-none tracking-tight text-ink">{inr(cost.sellingPrice)}</div>
          <div className="mt-1 text-[11.5px] text-ink-3">{cost.quantity} units · est. cost {inr(cost.estimatedCost)}</div>
          <div className="mt-3">
            <input type="range" min={8} max={35} step={0.5} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full accent-[var(--color-brand)]" />
          </div>
          <div className="mt-3 space-y-1.5 border-t border-line-2 pt-3 text-[12px]">
            <Row label="Est. cost / unit" value={inr(cost.perUnit)} strong />
            <Row label="Selling / unit" value={inr(cost.sellingPrice / cost.quantity)} />
            <Row label="Contribution" value={inr(cost.contribution)} />
          </div>
        </div>

        {/* Commodity watch */}
        <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 border-b border-line-2 px-4 py-3 text-[13px] font-bold text-ink"><Gauge className="h-4 w-4 text-ink-3" /> Commodity watch</div>
          <div className="divide-y divide-line-2">
            {COMMODITIES.map((c) => {
              const delta = (c.spotRate - c.cardRate) / c.cardRate;
              return (
                <div key={c.key} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <div className="text-[12.5px] font-medium text-ink">{c.label}</div>
                    <div className="tnum font-mono text-[10.5px] text-ink-4">card ₹{c.cardRate} → spot ₹{c.spotRate}/{c.unit}</div>
                  </div>
                  <span className={cn("tnum inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold", delta > 0 ? "bg-danger-soft text-danger" : "bg-ok-soft text-ok")}>
                    {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{pct(delta)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line-2 bg-warn-soft/40 px-4 py-2.5 text-[11.5px] text-ink-2">
            Copper spot is {pct((copperSpot.spotRate - copperSpot.cardRate) / copperSpot.cardRate)} above the rate card — {copperKg.toLocaleString("en-IN")} kg in this BOM is <b className="text-ink">{inr(copperExposure)}</b> of exposure.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- small controls ---- */
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className={cn("tnum font-mono", strong ? "font-semibold text-ink" : "text-ink-2")}>{value}</span>
    </div>
  );
}
function Select({ label, value, onChange, options, unit }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; unit?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between"><span className="text-[11.5px] font-semibold text-ink-2">{label}</span>{unit && <span className="text-[10px] text-ink-4">{unit}</span>}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Segmented({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <div className="mb-1 text-[11.5px] font-semibold text-ink-2">{label}</div>
      <div className="flex gap-1">
        {options.map((o) => (
          <button key={o.value} onClick={() => onChange(o.value)} className={cn("flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-semibold transition-colors", value === o.value ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface text-ink-3 hover:bg-surface-2")}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}
function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <div className="mb-1 text-[11.5px] font-semibold text-ink-2">{label}</div>
      <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Math.max(min ?? 1, Number(e.target.value)))} className="tnum w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-[12.5px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
    </div>
  );
}
