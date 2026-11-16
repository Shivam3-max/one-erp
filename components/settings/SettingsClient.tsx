"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Boxes, GitBranch, Coins, ShieldCheck, Users,
  ArrowRight, Check, Plus, Globe, Lock, Trash2, Power, Save, Receipt, FileText, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { money, shortDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, Mono } from "@/components/ui/Badge";
import { BRAND_COLORS } from "@/lib/mock/settings";
import { DEPARTMENT_LABEL } from "@/lib/lifecycle";
import { healthTone } from "@/lib/status";
import { toggleFamilyActive, saveTenant, addFamily, addStandard, inviteUser } from "@/app/actions/settings";
import { createRateCard, saveRateCard, activateRateCard, deleteRateCard } from "@/app/actions/rates";
import { saveCommercialConfig, saveQuoteTemplate } from "@/app/actions/commercial";
import { DEFAULT_FACTORS, type CostFactors } from "@/lib/configurator/model";
import { DEFAULT_COMMERCIAL, type CommercialConfig } from "@/lib/commercial";
import { DEFAULT_QUOTE_TEMPLATE, type QuoteTemplate, type QuoteTerm } from "@/lib/quote-template";

type TenantVM = { id: string; name: string; code: string; logoText: string; primaryCurrency: string; country: string; brandColor: string };
type UserVM = { id: string; name: string; initials: string; role: string; department: string; email: string };
type FamilyVM = { id: string; name: string; category: string; blurb: string; attributeCount: number; active: boolean; custom: boolean };
type WorkflowVM = { artifactType: string; label: string; states: string[]; approvalChain: string[] };
type StandardVM = { code: string; title: string; scope: "global" | "tenant" };
type RateCardVM = { id: string; effectiveFrom: string; label: string; active: boolean; rates: Record<string, { label: string; rate: number; unit: string }>; factors: CostFactors };

export interface SettingsData {
  tenant: TenantVM;
  users: UserVM[];
  families: FamilyVM[];
  workflows: WorkflowVM[];
  standards: StandardVM[];
  rateCards: RateCardVM[];
  commercial: CommercialConfig;
  quoteTemplate: QuoteTemplate;
}

type TabKey = "org" | "families" | "workflows" | "rates" | "commercial" | "quotation" | "standards" | "team";
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "org", label: "Organization", icon: Building2 },
  { key: "families", label: "Product Families", icon: Boxes },
  { key: "workflows", label: "Workflows", icon: GitBranch },
  { key: "rates", label: "Rate Cards", icon: Coins },
  { key: "commercial", label: "Commercial", icon: Receipt },
  { key: "quotation", label: "Quotation", icon: FileText },
  { key: "standards", label: "Standards", icon: ShieldCheck },
  { key: "team", label: "Team & Roles", icon: Users },
];

export function SettingsClient({ data, canManage = true }: { data: SettingsData; canManage?: boolean }) {
  const [tab, setTab] = useState<TabKey>("org");

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[210px_1fr]">
      <nav className="space-y-0.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                active ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-surface-3")}>
              <Icon className={cn("h-4 w-4", active ? "text-brand" : "text-ink-4")} />
              {t.label}
            </button>
          );
        })}
      </nav>

      <fieldset disabled={!canManage} className="m-0 min-w-0 border-0 p-0">
        {!canManage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12px] text-ink-3">
            <Lock className="h-4 w-4" /> You have read-only access. Editing settings requires a Manager or Administrator role.
          </div>
        )}
        {tab === "org" && <Org tenant={data.tenant} />}
        {tab === "families" && <Families families={data.families} />}
        {tab === "workflows" && <Workflows workflows={data.workflows} />}
        {tab === "rates" && <RateCards rateCards={data.rateCards} />}
        {tab === "commercial" && <Commercial config={data.commercial} />}
        {tab === "quotation" && <QuotationTemplate template={data.quoteTemplate} />}
        {tab === "standards" && <Standards standards={data.standards} />}
        {tab === "team" && <Team users={data.users} />}
      </fieldset>
    </div>
  );
}

/* ---------- Organization ---------- */
function Org({ tenant }: { tenant: TenantVM }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(tenant.name);
  const [brand, setBrand] = useState(tenant.brandColor);
  const dirty = name !== tenant.name || brand !== tenant.brandColor;

  const save = () => start(async () => { await saveTenant({ name, brandColor: brand }); router.refresh(); });

  return (
    <Panel title="Organization" desc="These settings white-label the entire platform for this tenant.">
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-line bg-brand-soft px-3 py-2 text-[12px] text-brand-ink">
        <Building2 className="h-4 w-4" /> You are configuring tenant <b>#1 · {tenant.name}</b>. Other manufacturers are separate tenants with their own config.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Company name</FieldLabel>
          <input value={name} onChange={(e) => setName(e.target.value)} className={cls} />
        </div>
        <Field label="Tenant code" value={tenant.code} />
        <Field label="Country" value={tenant.country} />
        <Field label="Primary currency" value={tenant.primaryCurrency} />
        <Field label="Logo text" value={tenant.logoText} />
        <div>
          <FieldLabel>Brand colour</FieldLabel>
          <div className="flex gap-2 pt-1">
            {BRAND_COLORS.map((c) => (
              <button key={c} onClick={() => setBrand(c)} style={{ background: c }}
                className={cn("h-8 w-8 rounded-lg ring-2 ring-offset-2 ring-offset-surface transition", brand === c ? "ring-ink" : "ring-transparent")}>
                {brand === c && <Check className="mx-auto h-4 w-4 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-line-2 pt-4">
        {dirty && <span className="text-[12px] text-ink-4">Unsaved changes</span>}
        <button onClick={save} disabled={!dirty || pending}
          className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:opacity-50">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Panel>
  );
}

/* ---------- Product Families ---------- */
function Families({ families }: { families: FamilyVM[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [local, setLocal] = useState(() => Object.fromEntries(families.map((f) => [f.id, f.active])));
  const toggle = (id: string) => {
    const next = !local[id];
    setLocal((s) => ({ ...s, [id]: next }));
    start(async () => { await toggleFamilyActive(id, next); router.refresh(); });
  };
  const [adding, setAdding] = useState(false);
  return (
    <Panel title="Product Families" desc="Families are defined as data — adding a product line is configuration, not code."
      action={<button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-ink"><Plus className="h-4 w-4" /> New family</button>}>
      {adding && (
        <InlineAddForm
          fields={[{ key: "name", label: "Family name (e.g. RMU 11 kV)" }, { key: "category", label: "Category (e.g. Switchgear)" }, { key: "blurb", label: "Short description" }]}
          onCancel={() => setAdding(false)}
          onSubmit={async (v) => { await addFamily({ name: v.name, category: v.category, blurb: v.blurb }); router.refresh(); setAdding(false); }}
        />
      )}
      <div className="divide-y divide-line-2 rounded-lg border border-line">
        {families.map((f) => (
          <div key={f.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><Boxes className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">{f.name}
                {f.custom && <span className="rounded bg-copper-soft px-1.5 py-px text-[9px] font-bold uppercase text-copper">custom</span>}
              </div>
              <div className="text-[11.5px] text-ink-3">{f.category} · {f.attributeCount} attributes · {f.blurb}</div>
            </div>
            {f.custom
              ? <Link href={`/settings/families/${f.id}`} className="text-[12px] font-semibold text-brand hover:underline">Studio →</Link>
              : <Link href="/configurator" className="text-[12px] font-semibold text-brand hover:underline">Configure →</Link>}
            <Toggle on={local[f.id]} onClick={() => toggle(f.id)} disabled={pending} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ink-3">Switchgear, RMU, cast-resin and other lines are added the same way — <b className="text-ink-2">New family</b>, then open the <b className="text-ink-2">Studio</b> to author its attributes &amp; BOM rules. No code change.</p>
    </Panel>
  );
}

/* ---------- Workflows ---------- */
function Workflows({ workflows }: { workflows: WorkflowVM[] }) {
  return (
    <Panel title="Workflows & Approval Chains" desc="Every status in the platform is one of these state machines — configurable per tenant.">
      <div className="space-y-4">
        {workflows.map((w) => (
          <div key={w.artifactType} className="rounded-lg border border-line p-4">
            <div className="mb-2.5 text-[13px] font-bold text-ink">{w.label}</div>
            <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-ink-4">States</div>
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {w.states.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="rounded-md bg-surface-3 px-2 py-1 text-[11.5px] font-medium text-ink-2">{s}</span>
                  {i < w.states.length - 1 && <ArrowRight className="h-3 w-3 text-ink-4" />}
                </span>
              ))}
            </div>
            <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-ink-4">Approval chain</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {w.approvalChain.map((r, i) => (
                <span key={r} className="flex items-center gap-1.5">
                  <span className="rounded-md border border-brand-line bg-brand-soft px-2 py-1 text-[11.5px] font-semibold text-brand-ink">{r}</span>
                  {i < w.approvalChain.length - 1 && <ArrowRight className="h-3 w-3 text-brand/50" />}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- Rate Cards (editable) ---------- */
function RateCards({ rateCards }: { rateCards: RateCardVM[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = rateCards.find((r) => r.active) ?? rateCards[0];
  const [selectedId, setSelectedId] = useState(active?.id ?? "");
  const selected = rateCards.find((r) => r.id === selectedId) ?? active;
  const [rates, setRates] = useState<Record<string, { label: string; rate: number; unit: string }>>(() => ({ ...(selected?.rates ?? {}) }));
  const [factors, setFactors] = useState<CostFactors>(() => ({ ...DEFAULT_FACTORS, ...(selected?.factors ?? {}) }));

  // re-sync the editor when the selected card (or its persisted data, after a save) changes
  const selKey = selected ? `${selected.id}|${JSON.stringify(selected.rates)}|${JSON.stringify(selected.factors)}` : "";
  useEffect(() => {
    if (selected) { setRates({ ...selected.rates }); setFactors({ ...DEFAULT_FACTORS, ...selected.factors }); }
  }, [selKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const newCard = (
    <NewCardButton onCreate={(v) => start(async () => { await createRateCard(v); router.refresh(); })} />
  );

  if (!selected) {
    return (
      <Panel title="Rate Cards" desc="Rates fluctuate — keep a dated card so every quote reproduces its original cost." action={newCard}>
        <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-ink-3">No rate cards yet — create your first one.</div>
      </Panel>
    );
  }

  const dirty = JSON.stringify(rates) !== JSON.stringify(selected.rates) || JSON.stringify(factors) !== JSON.stringify(selected.factors);
  const rateEntries = Object.entries(rates);
  const setRate = (key: string, patch: Partial<{ label: string; rate: number; unit: string }>) =>
    setRates((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  const removeMaterial = (key: string) => setRates((s) => { const n = { ...s }; delete n[key]; return n; });
  const addMaterial = (label: string, unit: string, rate: number) => {
    const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "").slice(0, 24) || "material";
    let key = base, i = 1; while (rates[key]) key = `${base}_${i++}`;
    setRates((s) => ({ ...s, [key]: { label: label.trim(), rate, unit: unit.trim() || "unit" } }));
  };
  const save = () => start(async () => { await saveRateCard(selected.id, { rates, factors }); router.refresh(); });

  return (
    <Panel title="Rate Cards" desc="Rates fluctuate — edit any rate, add your own materials, and the configurator + estimation recompute against the active card." action={newCard}>
      {/* version chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {rateCards.map((v) => {
          const isSel = v.id === selected.id;
          return (
            <div key={v.id} onClick={() => setSelectedId(v.id)}
              className={cn("group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[12px]", isSel ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-surface-2")}>
              <div>
                <div className={cn("flex items-center gap-1.5 font-semibold", isSel ? "text-brand-ink" : "text-ink")}>
                  {v.label}
                  {v.active && <span className="rounded bg-ok px-1 py-px text-[9px] font-bold uppercase text-white">active</span>}
                </div>
                <div className="tnum font-mono text-[11px] text-ink-4">eff. {shortDate(v.effectiveFrom)}</div>
              </div>
              {!v.active && (
                <button title="Delete card"
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete rate card "${v.label}"?`)) start(async () => { const r = await deleteRateCard(v.id); if (r.ok && selectedId === v.id) setSelectedId(active.id); router.refresh(); }); }}
                  className="text-ink-4 opacity-0 transition hover:text-danger group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          );
        })}
      </div>

      {/* selected-card toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2">
        <div className="text-[12.5px] text-ink-2">Editing <b className="text-ink">{selected.label}</b> · eff. {shortDate(selected.effectiveFrom)}{selected.active ? " · this is the live card" : ""}</div>
        <div className="flex items-center gap-2">
          {!selected.active && (
            <button onClick={() => start(async () => { await activateRateCard(selected.id); router.refresh(); })} disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-brand-line bg-brand-soft px-2.5 py-1.5 text-[12px] font-semibold text-brand-ink hover:bg-brand-soft/70 disabled:opacity-50"><Power className="h-3.5 w-3.5" /> Make active</button>
          )}
          <button onClick={save} disabled={!dirty || pending}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-ink disabled:opacity-50"><Save className="h-3.5 w-3.5" /> {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
        </div>
      </div>

      {/* material rates */}
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-[1fr_110px_78px_30px] gap-2 border-b border-line-2 bg-surface-2 px-3 py-2 text-[10.5px] font-bold uppercase tracking-wide text-ink-4">
          <span>Material</span><span className="text-right">Rate ₹</span><span>Unit</span><span></span>
        </div>
        <div className="max-h-72 divide-y divide-line-2 overflow-y-auto">
          {rateEntries.map(([key, r]) => (
            <div key={key} className="grid grid-cols-[1fr_110px_78px_30px] items-center gap-2 px-3 py-1.5">
              <input value={r.label} onChange={(e) => setRate(key, { label: e.target.value })}
                className="rounded border border-transparent bg-transparent px-1.5 py-1 text-[12.5px] text-ink-2 outline-none hover:border-line focus:border-brand-line focus:bg-surface" />
              <input type="number" value={r.rate} onChange={(e) => setRate(key, { rate: Number(e.target.value) })}
                className="tnum rounded border border-line bg-surface px-2 py-1 text-right font-mono text-[12.5px] font-semibold text-ink outline-none focus:border-brand-line" />
              <input value={r.unit} onChange={(e) => setRate(key, { unit: e.target.value })}
                className="rounded border border-line bg-surface px-2 py-1 text-[11.5px] text-ink-3 outline-none focus:border-brand-line" />
              <button onClick={() => removeMaterial(key)} title="Remove" className="mx-auto text-ink-4 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <AddMaterialRow onAdd={addMaterial} />
      </div>

      {/* cost factors */}
      <div className="mt-4 rounded-lg border border-line p-4">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-4">Cost build-up factors</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FactorField label="Labour" suffix="% of material" value={factors.labourPct} onChange={(n) => setFactors((f) => ({ ...f, labourPct: n }))} />
          <FactorField label="Overhead" suffix="% mat+labour" value={factors.overheadPct} onChange={(n) => setFactors((f) => ({ ...f, overheadPct: n }))} />
          <FactorField label="Logistics" suffix="% of material" value={factors.logisticsPct} onChange={(n) => setFactors((f) => ({ ...f, logisticsPct: n }))} />
          <FactorField label="Routine testing" suffix="₹ / unit" value={factors.routineTesting} onChange={(n) => setFactors((f) => ({ ...f, routineTesting: n }))} />
          <FactorField label="Type test" suffix="₹ one-time" value={factors.typeTest} onChange={(n) => setFactors((f) => ({ ...f, typeTest: n }))} />
          <FactorField label="Impulse test" suffix="₹ one-time" value={factors.impulseTest} onChange={(n) => setFactors((f) => ({ ...f, impulseTest: n }))} />
          <FactorField label="Short-circuit test" suffix="₹ one-time" value={factors.scTest} onChange={(n) => setFactors((f) => ({ ...f, scTest: n }))} />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-ink-3">The <b className="text-ink-2">active</b> card drives every live cost, estimate and new quotation. Old quotations keep the card they were priced on.</p>
    </Panel>
  );
}

function NewCardButton({ onCreate }: { onCreate: (v: { label: string; effectiveFrom: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-ink"><Plus className="h-4 w-4" /> New rate card</button>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={label} placeholder="Label (e.g. Q3 FY27)" onChange={(e) => setLabel(e.target.value)} className="w-36 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] outline-none focus:border-brand-line" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[12.5px] text-ink-2 outline-none focus:border-brand-line" />
      <button onClick={() => { if (label.trim()) { onCreate({ label, effectiveFrom: date }); setOpen(false); setLabel(""); } }} disabled={!label.trim()} className="rounded-lg bg-brand px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-ink disabled:opacity-50">Create</button>
      <button onClick={() => setOpen(false)} className="rounded-lg border border-line px-2 py-1.5 text-[12px] font-semibold text-ink-3 hover:bg-surface-3">Cancel</button>
    </div>
  );
}

function AddMaterialRow({ onAdd }: { onAdd: (label: string, unit: string, rate: number) => void }) {
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("kg");
  const [rate, setRate] = useState(0);
  const add = () => { if (label.trim()) { onAdd(label, unit, rate); setLabel(""); setUnit("kg"); setRate(0); } };
  return (
    <div className="grid grid-cols-[1fr_110px_78px_30px] items-center gap-2 border-t border-line-2 bg-brand-soft/20 px-3 py-2">
      <input value={label} placeholder="Add a material…" onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
        className="rounded border border-line bg-surface px-2 py-1 text-[12.5px] outline-none placeholder:text-ink-4 focus:border-brand-line" />
      <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))}
        className="tnum rounded border border-line bg-surface px-2 py-1 text-right font-mono text-[12.5px] outline-none focus:border-brand-line" />
      <input value={unit} onChange={(e) => setUnit(e.target.value)}
        className="rounded border border-line bg-surface px-2 py-1 text-[11.5px] outline-none focus:border-brand-line" />
      <button onClick={add} disabled={!label.trim()} title="Add material" className="mx-auto text-brand hover:text-brand-ink disabled:opacity-30"><Plus className="h-4 w-4" /></button>
    </div>
  );
}

function FactorField({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between"><span className="text-[11.5px] font-semibold text-ink-2">{label}</span><span className="text-[10px] text-ink-4">{suffix}</span></div>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="tnum w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-right font-mono text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
    </div>
  );
}

/* ---------- Commercial defaults ---------- */
type NumKeys = Exclude<keyof CommercialConfig, "paymentTerms">;
function Commercial({ config }: { config: CommercialConfig }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const base = { ...DEFAULT_COMMERCIAL, ...config };
  const [c, setC] = useState<CommercialConfig>(base);
  const selKey = JSON.stringify(base);
  useEffect(() => { setC({ ...DEFAULT_COMMERCIAL, ...config }); }, [selKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(c) !== selKey;
  const numField = (k: NumKeys, label: string, suffix: string) => (
    <FactorField label={label} suffix={suffix} value={c[k]} onChange={(n) => setC((s) => ({ ...s, [k]: n }))} />
  );
  const save = () => start(async () => { await saveCommercialConfig(c); router.refresh(); });
  return (
    <Panel title="Commercial defaults" desc="The pricing knobs behind every estimate and quotation — margins, charges, terms and loss-capitalization. A customer can override any of them."
      action={<button onClick={save} disabled={!dirty || pending} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-ink disabled:opacity-50"><Save className="h-4 w-4" /> {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>}>
      <Section title="Pricing">
        {numField("marginPct", "Default margin", "% on cost")}
        {numField("dealerPct", "Dealer commission", "% of selling")}
        {numField("riskPct", "Risk buffer", "% on landed")}
      </Section>
      <Section title="Charges">
        {numField("freightPct", "Freight", "% of ex-works")}
        {numField("packingPct", "Packing", "% of ex-works")}
        {numField("insurancePct", "Insurance", "% of ex-works")}
        {numField("gstPct", "Output GST", "%")}
      </Section>
      <Section title="Terms">
        <div className="sm:col-span-2">
          <div className="mb-1 text-[11.5px] font-semibold text-ink-2">Payment terms</div>
          <input value={c.paymentTerms} onChange={(e) => setC((s) => ({ ...s, paymentTerms: e.target.value }))}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
        </div>
        {numField("validityDays", "Offer validity", "days")}
        {numField("warrantyMonths", "Warranty", "months")}
      </Section>
      <Section title="Loss capitalization · utility tenders">
        {numField("noLoadCapRate", "No-load loss", "₹ / W")}
        {numField("loadCapRate", "Load loss", "₹ / W")}
      </Section>
      <p className="mt-4 text-[12px] text-ink-3">These seed every new estimate & quotation. Utilities publish their own loss-capitalization ₹/W — set them per customer to score bids the way the tender will.</p>
    </Panel>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-4">{title}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

/* ---------- Quotation template ---------- */
function QuotationTemplate({ template }: { template: QuoteTemplate }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const base = { ...DEFAULT_QUOTE_TEMPLATE, ...template };
  const [t, setT] = useState<QuoteTemplate>(base);
  const selKey = JSON.stringify(base);
  useEffect(() => { setT({ ...DEFAULT_QUOTE_TEMPLATE, ...template }); }, [selKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(t) !== selKey;
  const save = () => start(async () => { await saveQuoteTemplate(t); router.refresh(); });
  return (
    <Panel title="Quotation template" desc="The boilerplate that makes every offer look like yours — scope, exclusions, standard terms and notes. (Payment / validity / warranty come from Commercial.)"
      action={<button onClick={save} disabled={!dirty || pending} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-ink disabled:opacity-50"><Save className="h-4 w-4" /> {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>}>
      <div className="space-y-5">
        <ListEditor title="Scope of supply" placeholder="Add a scope line…" items={t.scope} onChange={(scope) => setT((s) => ({ ...s, scope }))} />
        <ListEditor title="Exclusions" placeholder="Add an exclusion…" items={t.exclusions} onChange={(exclusions) => setT((s) => ({ ...s, exclusions }))} />
        <TermsEditor terms={t.terms} onChange={(terms) => setT((s) => ({ ...s, terms }))} />
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-4">Cover note</div>
          <textarea value={t.coverNote} onChange={(e) => setT((s) => ({ ...s, coverNote: e.target.value }))} rows={3}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink-2 outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
          <div className="mt-1 text-[11px] text-ink-4">Tokens <Mono>{"{{product}}"}</Mono> and <Mono>{"{{customer}}"}</Mono> are filled in per quote.</div>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-4">Footer note</div>
          <textarea value={t.footerNote} onChange={(e) => setT((s) => ({ ...s, footerNote: e.target.value }))} rows={2}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink-2 outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
        </div>
      </div>
    </Panel>
  );
}

function ListEditor({ title, placeholder, items, onChange }: { title: string; placeholder: string; items: string[]; onChange: (items: string[]) => void }) {
  const [val, setVal] = useState("");
  const add = () => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } };
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-4">{title}</div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5">
            <input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className="flex-1 bg-transparent text-[12.5px] text-ink-2 outline-none" />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-ink-4 hover:text-danger" title="Remove"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        <input value={val} placeholder={placeholder} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] outline-none placeholder:text-ink-4 focus:border-brand-line" />
        <button onClick={add} disabled={!val.trim()} className="flex items-center gap-1 rounded-lg border border-brand-line bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand-ink hover:bg-brand-soft/70 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
    </div>
  );
}

function TermsEditor({ terms, onChange }: { terms: QuoteTerm[]; onChange: (t: QuoteTerm[]) => void }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const add = () => { if (label.trim()) { onChange([...terms, { label: label.trim(), value: value.trim() }]); setLabel(""); setValue(""); } };
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-4">Standard terms (extra)</div>
      <div className="space-y-1.5">
        {terms.map((tm, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5">
            <input value={tm.label} onChange={(e) => onChange(terms.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="w-32 shrink-0 bg-transparent text-[12.5px] font-semibold text-ink outline-none" />
            <input value={tm.value} onChange={(e) => onChange(terms.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="flex-1 bg-transparent text-[12.5px] text-ink-2 outline-none" />
            <button onClick={() => onChange(terms.filter((_, j) => j !== i))} className="text-ink-4 hover:text-danger" title="Remove"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        <input value={label} placeholder="Label" onChange={(e) => setLabel(e.target.value)} className="w-32 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] outline-none placeholder:text-ink-4 focus:border-brand-line" />
        <input value={value} placeholder="Value" onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] outline-none placeholder:text-ink-4 focus:border-brand-line" />
        <button onClick={add} disabled={!label.trim()} className="flex items-center gap-1 rounded-lg border border-brand-line bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand-ink hover:bg-brand-soft/70 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
    </div>
  );
}

/* ---------- Standards ---------- */
function Standards({ standards }: { standards: StandardVM[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  return (
    <Panel title="Standards Library" desc="Global standards are shared across all tenants; tenant standards are yours alone."
      action={<button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-ink-2 hover:bg-surface-3"><Plus className="h-4 w-4" /> Add</button>}>
      {adding && (
        <InlineAddForm
          fields={[{ key: "code", label: "Code (e.g. IEC 62271)" }, { key: "title", label: "Title" }, { key: "scope", label: "Scope", options: ["tenant", "global"] }]}
          onCancel={() => setAdding(false)}
          onSubmit={async (v) => { await addStandard({ code: v.code, title: v.title, scope: v.scope }); router.refresh(); setAdding(false); }}
        />
      )}
      <div className="divide-y divide-line-2 rounded-lg border border-line">
        {standards.map((s) => (
          <div key={s.code} className="flex items-center gap-3 px-4 py-2.5">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.scope === "global" ? "bg-brand-soft text-brand" : "bg-copper-soft text-copper")}>
              {s.scope === "global" ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </span>
            <div className="flex-1">
              <Mono className="font-semibold text-ink">{s.code}</Mono>
              <div className="text-[11.5px] text-ink-3">{s.title}</div>
            </div>
            <Badge tone={s.scope === "global" ? healthTone["on-track"] : { text: "text-copper", bg: "bg-copper-soft", dot: "bg-copper", border: "" }}>
              {s.scope}
            </Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- Team ---------- */
function Team({ users }: { users: UserVM[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  return (
    <Panel title="Team & Roles" desc="Members and their departments. Roles drive the approval chains above."
      action={<button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-ink"><Plus className="h-4 w-4" /> Invite</button>}>
      {adding && (
        <InlineAddForm
          fields={[{ key: "name", label: "Full name" }, { key: "email", label: "Email" }, { key: "role", label: "Role (e.g. Design Engineer)" }, { key: "department", label: "Department", options: ["sales", "application-engineering", "design-engineering", "estimation", "procurement", "manufacturing", "quality", "commercial", "management"] }]}
          onCancel={() => setAdding(false)}
          onSubmit={async (v) => { await inviteUser({ name: v.name, email: v.email, role: v.role, department: v.department }); router.refresh(); setAdding(false); }}
        />
      )}
      <div className="divide-y divide-line-2 rounded-lg border border-line">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar initials={u.initials} name={u.name} size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">{u.name}</div>
              <div className="text-[11.5px] text-ink-3">{u.email}</div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-[12px] font-medium text-ink-2">{u.role}</div>
              <div className="text-[11px] text-ink-4">{DEPARTMENT_LABEL[u.department as keyof typeof DEPARTMENT_LABEL]}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- shared ---------- */
const cls = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft";

function InlineAddForm({ fields, onSubmit, onCancel }: { fields: { key: string; label: string; options?: string[] }[]; onSubmit: (v: Record<string, string>) => Promise<void>; onCancel: () => void }) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, f.options ? f.options[0] : ""])));
  const [pending, start] = useTransition();
  const required = fields[0].key;
  return (
    <div className="mb-3 rounded-lg border border-brand-line bg-brand-soft/30 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((f) => f.options ? (
          <select key={f.key} value={v[f.key]} onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line">
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input key={f.key} value={v[f.key]} placeholder={f.label} onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-4 focus:border-brand-line" />
        ))}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:bg-surface-3">Cancel</button>
        <button onClick={() => v[required]?.trim() && start(async () => { await onSubmit(v); })} disabled={pending || !v[required]?.trim()}
          className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-ink disabled:opacity-50">{pending ? "Saving…" : "Add"}</button>
      </div>
    </div>
  );
}
function Panel({ title, desc, action, children }: { title: string; desc: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-3">{desc}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11.5px] font-semibold text-ink-2">{children}</label>;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input defaultValue={value} className={cls} />
    </div>
  );
}
function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60", on ? "bg-brand" : "bg-line-strong")}>
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}
