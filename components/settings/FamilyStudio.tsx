"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Boxes, Calculator, Sparkles, CircleDot, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { initValues, computeCost, type AttrDef, type AttrType, type RateBook } from "@/lib/configurator/model";
import { customToFamilyDef, EMPTY_SCHEMA, type CustomSchema, type BomQtyMode, type DbFamily } from "@/lib/configurator/custom";
import { saveFamilySchema } from "@/app/actions/settings";

const inr = (n: number) => money({ amount: Math.round(n), currency: "INR" });
const QTY_MODES: { value: BomQtyMode; label: string }[] = [
  { value: "fixed", label: "Fixed / unit" },
  { value: "perMVA", label: "× rating (MVA)" },
  { value: "perAttr", label: "× attribute" },
];

export function FamilyStudio({ family, rateBook, canManage = true }: { family: DbFamily; rateBook: RateBook; canManage?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const dirtyReset = () => setSaved(false);

  const [name, setName] = useState(family.name);
  const [category, setCategory] = useState(family.category);
  const [blurb, setBlurb] = useState(family.blurb);
  const initSchema = family.schema && family.schema.groups.length ? family.schema : EMPTY_SCHEMA;
  const [schema, setSchema] = useState<CustomSchema>(() => JSON.parse(JSON.stringify(initSchema)) as CustomSchema);

  const group = schema.groups[0] ?? { id: "spec", label: "Specification", attributes: [] };
  const attrs = group.attributes;
  const numericAttrs = attrs.filter((a) => a.type === "number");
  const rateKeys = Object.entries(rateBook.rates);

  const patchAttrs = (fn: (a: AttrDef[]) => AttrDef[]) => { dirtyReset(); setSchema((s) => { const g = s.groups[0] ?? { id: "spec", label: "Specification", attributes: [] }; return { ...s, groups: [{ ...g, attributes: fn(g.attributes) }] }; }); };
  const patchSchema = (patch: Partial<CustomSchema>) => { dirtyReset(); setSchema((s) => ({ ...s, ...patch })); };

  const newAttrId = (existing: AttrDef[]) => { let id = ""; do { id = "a_" + Math.random().toString(36).slice(2, 6); } while (existing.some((a) => a.id === id)); return id; };
  const addAttr = () => patchAttrs((a) => [...a, { id: newAttrId(a), label: "New attribute", type: "number", unit: "", default: 0, min: 0 }]);
  const updateAttr = (i: number, patch: Partial<AttrDef>) => patchAttrs((a) => a.map((x, j) => {
    if (j !== i) return x;
    const next = { ...x, ...patch };
    if (patch.type) {
      if (patch.type === "enum" && !next.options?.length) { next.options = [{ value: "a", label: "Option A" }]; next.default = "a"; }
      if (patch.type === "number") next.default = Number(next.default) || 0;
      if (patch.type === "boolean") next.default = Boolean(next.default);
    }
    return next;
  }));
  const removeAttr = (i: number) => patchAttrs((a) => a.filter((_, j) => j !== i));

  const addRule = () => { dirtyReset(); setSchema((s) => ({ ...s, bom: [...s.bom, { rateKey: rateKeys[0]?.[0] ?? "copper", label: rateKeys[0]?.[1].label ?? "", category: "Material", unit: rateKeys[0]?.[1].unit ?? "kg", qtyMode: "fixed", qty: 1 }] })); };
  const updateRule = (i: number, patch: Partial<CustomSchema["bom"][number]>) => { dirtyReset(); setSchema((s) => ({ ...s, bom: s.bom.map((r, j) => (j === i ? { ...r, ...patch } : r)) })); };
  const removeRule = (i: number) => { dirtyReset(); setSchema((s) => ({ ...s, bom: s.bom.filter((_, j) => j !== i) })); };

  // live preview — compile the schema and price it against the active rate card
  const preview = useMemo(() => {
    try {
      const def = customToFamilyDef({ ...family, name, category, blurb, schema });
      const v = initValues(def);
      const d = def.derive(v);
      const bom = def.emitBom(v, d);
      const cost = computeCost(bom, v, 18, rateBook);
      return { bom, cost };
    } catch { return { bom: [], cost: null }; }
  }, [schema, family, name, category, blurb, rateBook]);

  const save = () => start(async () => {
    await saveFamilySchema(family.id, { name, category, blurb }, { ...schema, groups: [{ ...group, attributes: attrs }] });
    setSaved(true);
    router.refresh();
  });

  const usable = attrs.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/settings" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-brand"><ArrowLeft className="h-3.5 w-3.5" /> Settings</Link>
        <div className="flex items-center gap-2">
          {usable && <Link href="/configurator" className="rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink-2 hover:bg-surface-3">Open in configurator →</Link>}
          {canManage && (
            <button onClick={save} disabled={pending} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:opacity-50">
              <Save className="h-4 w-4" /> {pending ? "Saving…" : saved ? "Saved" : "Save family"}
            </button>
          )}
        </div>
      </div>

      <fieldset disabled={!canManage} className="m-0 grid grid-cols-1 gap-4 border-0 p-0 lg:grid-cols-[1fr_360px]">
        {/* left: authoring */}
        <div className="min-w-0 space-y-4">
          {/* meta */}
          <Panel title="Family" desc="Any product line — cast-resin, RMU, VCB panel — is authored here as data.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Labeled label="Name"><input value={name} onChange={(e) => { setName(e.target.value); dirtyReset(); }} className={inputCls} /></Labeled>
              <Labeled label="Category"><input value={category} onChange={(e) => { setCategory(e.target.value); dirtyReset(); }} className={inputCls} /></Labeled>
              <div className="sm:col-span-2"><Labeled label="Description"><input value={blurb} onChange={(e) => { setBlurb(e.target.value); dirtyReset(); }} className={inputCls} /></Labeled></div>
            </div>
          </Panel>

          {/* attributes */}
          <Panel title="Attributes" desc="The spec fields an engineer configures. Mark one number as the rating to drive per-MVA BOM lines."
            action={<button onClick={addAttr} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-ink"><Plus className="h-4 w-4" /> Attribute</button>}>
            {attrs.length === 0 && <Empty>No attributes yet — add the first spec field.</Empty>}
            <div className="space-y-2">
              {attrs.map((a, i) => (
                <div key={a.id} className="rounded-lg border border-line bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={a.label} onChange={(e) => updateAttr(i, { label: e.target.value })} placeholder="Label" className="min-w-[140px] flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-semibold text-ink outline-none focus:border-brand-line" />
                    <select value={a.type} onChange={(e) => updateAttr(i, { type: e.target.value as AttrType })} className="rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-ink-2 outline-none focus:border-brand-line">
                      <option value="number">number</option><option value="enum">choice</option><option value="boolean">yes/no</option>
                    </select>
                    <input value={a.unit ?? ""} onChange={(e) => updateAttr(i, { unit: e.target.value })} placeholder="unit" className="w-16 rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-ink-3 outline-none focus:border-brand-line" />
                    <button onClick={() => removeAttr(i)} className="text-ink-4 hover:text-danger" title="Remove attribute"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
                    {a.type === "number" && (
                      <>
                        <Mini label="default"><input type="number" value={Number(a.default)} onChange={(e) => updateAttr(i, { default: Number(e.target.value) })} className={miniInput} /></Mini>
                        <Mini label="min"><input type="number" value={a.min ?? 0} onChange={(e) => updateAttr(i, { min: Number(e.target.value) })} className={miniInput} /></Mini>
                        <Mini label="max"><input type="number" value={a.max ?? 0} onChange={(e) => updateAttr(i, { max: Number(e.target.value) })} className={miniInput} /></Mini>
                        <button onClick={() => patchSchema({ mvaAttrId: schema.mvaAttrId === a.id ? undefined : a.id })}
                          className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold", schema.mvaAttrId === a.id ? "border-brand-line bg-brand-soft text-brand-ink" : "border-line text-ink-3 hover:bg-surface-2")}>
                          {schema.mvaAttrId === a.id ? <CircleDot className="h-3 w-3" /> : <Circle className="h-3 w-3" />} rating
                        </button>
                      </>
                    )}
                    {a.type === "enum" && (
                      <Mini label="options (comma-separated)">
                        <input value={(a.options ?? []).map((o) => o.label).join(", ")} onChange={(e) => {
                          const options = e.target.value.split(",").map((l) => l.trim()).filter(Boolean).map((l) => ({ value: l.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: l }));
                          updateAttr(i, { options, default: options[0]?.value ?? "" });
                        }} className="w-64 rounded-md border border-line bg-surface px-2 py-1 text-[12px] outline-none focus:border-brand-line" />
                      </Mini>
                    )}
                    {a.type === "boolean" && (
                      <label className="inline-flex items-center gap-1.5 text-ink-3"><input type="checkbox" checked={Boolean(a.default)} onChange={(e) => updateAttr(i, { default: e.target.checked })} /> default on</label>
                    )}
                    <span className="font-mono text-[10px] text-ink-4">id: {a.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* BOM rules */}
          <Panel title="BOM rules" desc="Each rule adds a material line. Quantity can be fixed, scale with the rating, or scale with an attribute — priced against the active rate card."
            action={<button onClick={addRule} disabled={rateKeys.length === 0} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-ink disabled:opacity-40"><Plus className="h-4 w-4" /> BOM line</button>}>
            {schema.bom.length === 0 && <Empty>No BOM lines yet — add materials so the family computes a cost.</Empty>}
            <div className="space-y-2">
              {schema.bom.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-2.5">
                  <select value={r.rateKey} onChange={(e) => { const rk = rateBook.rates[e.target.value]; updateRule(i, { rateKey: e.target.value, label: r.label || rk?.label || "", unit: r.unit || rk?.unit || "unit" }); }}
                    className="rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] font-medium text-ink outline-none focus:border-brand-line">
                    {rateKeys.map(([k, rr]) => <option key={k} value={k}>{rr.label} (₹{rr.rate}/{rr.unit})</option>)}
                  </select>
                  <input value={r.label} onChange={(e) => updateRule(i, { label: e.target.value })} placeholder="Line label" className="min-w-[120px] flex-1 rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-brand-line" />
                  <select value={r.qtyMode} onChange={(e) => updateRule(i, { qtyMode: e.target.value as BomQtyMode })} className="rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-ink-2 outline-none focus:border-brand-line">
                    {QTY_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <input type="number" value={r.qty} onChange={(e) => updateRule(i, { qty: Number(e.target.value) })} className="tnum w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-right font-mono text-[12px] outline-none focus:border-brand-line" />
                  {r.qtyMode === "perAttr" && (
                    <select value={r.attrId ?? ""} onChange={(e) => updateRule(i, { attrId: e.target.value })} className="rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-ink-2 outline-none focus:border-brand-line">
                      <option value="">— attribute —</option>
                      {numericAttrs.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  )}
                  <button onClick={() => removeRule(i)} className="text-ink-4 hover:text-danger" title="Remove line"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* right: live preview */}
        <div className="lg:sticky lg:top-[76px] lg:self-start">
          <div className="space-y-3">
            <div className="rounded-[var(--radius-lg)] border border-line bg-ink p-4 text-white shadow-[var(--shadow-pop)]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/60"><Sparkles className="h-3.5 w-3.5" /> Live preview (at defaults)</div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/10 px-2 py-2 text-center"><Boxes className="mx-auto h-4 w-4 text-white/70" /><div className="mt-1 tnum font-mono text-[17px] font-semibold">{preview.bom.length}</div><div className="text-[9.5px] uppercase tracking-wide text-white/50">BOM lines</div></div>
                <div className="rounded-lg bg-white/10 px-2 py-2 text-center"><Calculator className="mx-auto h-4 w-4 text-white/70" /><div className="mt-1 tnum font-mono text-[15px] font-semibold">{preview.cost ? inr(preview.cost.estimatedCost) : "—"}</div><div className="text-[9.5px] uppercase tracking-wide text-white/50">Est. cost</div></div>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
              <div className="border-b border-line-2 px-4 py-2.5 text-[12.5px] font-bold text-ink">Compiled BOM</div>
              <div className="max-h-[420px] divide-y divide-line-2 overflow-y-auto">
                {preview.bom.length === 0 && <div className="px-4 py-6 text-[12px] text-ink-4">Add BOM rules to see the bill of material.</div>}
                {preview.bom.map((l) => (
                  <div key={l.key} className="flex items-center gap-2 px-4 py-2">
                    <span className="w-16 shrink-0 truncate rounded bg-surface-3 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">{l.category}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{l.description}</span>
                    <span className="tnum shrink-0 font-mono text-[11px] text-ink-3">{l.qty.toLocaleString("en-IN")} {l.unit}</span>
                  </div>
                ))}
              </div>
              {preview.cost && (
                <div className="border-t border-line-2 px-4 py-2.5 text-[12px]">
                  <div className="flex items-center justify-between"><span className="text-ink-3">Material / unit</span><span className="tnum font-mono font-semibold text-ink">{inr(preview.cost.material)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft";
const miniInput = "tnum w-16 rounded border border-line bg-surface px-1.5 py-0.5 text-right font-mono text-[11.5px] outline-none focus:border-brand-line";

function Panel({ title, desc, action, children }: { title: string; desc: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2><p className="mt-0.5 text-[12px] text-ink-3">{desc}</p></div>
        {action}
      </div>
      {children}
    </div>
  );
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[11.5px] font-semibold text-ink-2">{label}</label><div className="mt-1">{children}</div></div>;
}
function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 text-ink-4"><span className="text-[10.5px]">{label}</span>{children}</span>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-ink-4">{children}</div>;
}
