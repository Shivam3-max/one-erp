"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Boxes, GitBranch, Coins, ShieldCheck, Users,
  ArrowRight, Check, Plus, Globe, Lock,
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

type TenantVM = { id: string; name: string; code: string; logoText: string; primaryCurrency: string; country: string; brandColor: string };
type UserVM = { id: string; name: string; initials: string; role: string; department: string; email: string };
type FamilyVM = { id: string; name: string; category: string; blurb: string; attributeCount: number; active: boolean };
type WorkflowVM = { artifactType: string; label: string; states: string[]; approvalChain: string[] };
type StandardVM = { code: string; title: string; scope: "global" | "tenant" };
type RateCardVM = { effectiveFrom: string; label: string; active: boolean; rates: Record<string, { label: string; rate: number; unit: string }> };

export interface SettingsData {
  tenant: TenantVM;
  users: UserVM[];
  families: FamilyVM[];
  workflows: WorkflowVM[];
  standards: StandardVM[];
  rateCards: RateCardVM[];
}

type TabKey = "org" | "families" | "workflows" | "rates" | "standards" | "team";
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "org", label: "Organization", icon: Building2 },
  { key: "families", label: "Product Families", icon: Boxes },
  { key: "workflows", label: "Workflows", icon: GitBranch },
  { key: "rates", label: "Rate Cards", icon: Coins },
  { key: "standards", label: "Standards", icon: ShieldCheck },
  { key: "team", label: "Team & Roles", icon: Users },
];

export function SettingsClient({ data }: { data: SettingsData }) {
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

      <div className="min-w-0">
        {tab === "org" && <Org tenant={data.tenant} />}
        {tab === "families" && <Families families={data.families} />}
        {tab === "workflows" && <Workflows workflows={data.workflows} />}
        {tab === "rates" && <RateCards rateCards={data.rateCards} />}
        {tab === "standards" && <Standards standards={data.standards} />}
        {tab === "team" && <Team users={data.users} />}
      </div>
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
              <div className="text-[13.5px] font-semibold text-ink">{f.name}</div>
              <div className="text-[11.5px] text-ink-3">{f.category} · {f.attributeCount} attributes · {f.blurb}</div>
            </div>
            <Link href="/configurator" className="text-[12px] font-semibold text-brand hover:underline">Configure →</Link>
            <Toggle on={local[f.id]} onClick={() => toggle(f.id)} disabled={pending} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ink-3">Switchgear, RMU, cast-resin and other families are added the same way — no code change.</p>
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

/* ---------- Rate Cards ---------- */
function RateCards({ rateCards }: { rateCards: RateCardVM[] }) {
  const active = rateCards.find((r) => r.active) ?? rateCards[0];
  const rates = active ? Object.entries(active.rates) : [];
  return (
    <Panel title="Rate Cards" desc="Rate cards are dated — an old quotation always reproduces its original cost.">
      <div className="mb-4 flex flex-wrap gap-2">
        {rateCards.map((v) => (
          <div key={v.effectiveFrom} className={cn("rounded-lg border px-3 py-2 text-[12px]", v.active ? "border-brand bg-brand-soft" : "border-line bg-surface")}>
            <div className={cn("font-semibold", v.active ? "text-brand-ink" : "text-ink")}>{v.label}</div>
            <div className="tnum font-mono text-[11px] text-ink-4">eff. {shortDate(v.effectiveFrom)}</div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="flex items-center justify-between border-b border-line-2 bg-surface-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-4">
          <span>Current rate card · effective {active ? shortDate(active.effectiveFrom) : "—"}</span><span>Rate</span>
        </div>
        <div className="max-h-80 divide-y divide-line-2 overflow-y-auto">
          {rates.map(([key, r]) => (
            <div key={key} className="flex items-center justify-between px-4 py-2 text-[12.5px]">
              <span className="text-ink-2">{r.label}</span>
              <span className="tnum font-mono font-semibold text-ink">{money({ amount: r.rate, currency: "INR" }, { compact: false })}<span className="text-ink-4"> /{r.unit}</span></span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
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
