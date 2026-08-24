"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Percent } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { saveCustomerCommercial } from "@/app/actions/commercial";
import type { CommercialConfig, CustomerCommercial } from "@/lib/commercial";

export function CustomerCommercialCard({
  customerId, override, defaults,
}: { customerId: string; override: CustomerCommercial; defaults: CommercialConfig }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const str = (v: number | string | undefined) => (v === undefined || v === null ? "" : String(v));
  const [discountPct, setDiscountPct] = useState(str(override.discountPct));
  const [marginPct, setMarginPct] = useState(str(override.marginPct));
  const [noLoad, setNoLoad] = useState(str(override.noLoadCapRate));
  const [load, setLoad] = useState(str(override.loadCapRate));
  const [payment, setPayment] = useState(override.paymentTerms ?? "");
  const [notes, setNotes] = useState(override.notes ?? "");

  const build = (): CustomerCommercial => {
    const o: CustomerCommercial = {};
    if (discountPct.trim()) o.discountPct = Number(discountPct);
    if (marginPct.trim()) o.marginPct = Number(marginPct);
    if (noLoad.trim()) o.noLoadCapRate = Number(noLoad);
    if (load.trim()) o.loadCapRate = Number(load);
    if (payment.trim()) o.paymentTerms = payment.trim();
    if (notes.trim()) o.notes = notes.trim();
    return o;
  };
  const save = () => start(async () => { await saveCustomerCommercial(customerId, build()); setSaved(true); router.refresh(); });

  const hasOverrides = Object.keys(build()).length > 0;

  return (
    <Card>
      <CardHeader title="Commercial terms" subtitle="Overrides the tenant defaults for this customer" />
      <div className="space-y-3 px-5 pb-5">
        <div className="rounded-lg border border-brand-line bg-brand-soft/40 px-3 py-2 text-[11.5px] text-brand-ink">
          Leave a field blank to inherit the tenant default (shown as the placeholder). Utilities publish their own loss-capitalization ₹/W — set them here to price bids the way that tender scores them.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Special discount" suffix="%" value={discountPct} onChange={(v) => { setDiscountPct(v); setSaved(false); }} placeholder="0" />
          <NumField label="Margin override" suffix="%" value={marginPct} onChange={(v) => { setMarginPct(v); setSaved(false); }} placeholder={String(defaults.marginPct)} />
          <NumField label="No-load loss cap" suffix="₹/W" value={noLoad} onChange={(v) => { setNoLoad(v); setSaved(false); }} placeholder={String(defaults.noLoadCapRate)} />
          <NumField label="Load loss cap" suffix="₹/W" value={load} onChange={(v) => { setLoad(v); setSaved(false); }} placeholder={String(defaults.loadCapRate)} />
        </div>
        <div>
          <FieldLabel>Payment terms override</FieldLabel>
          <input value={payment} onChange={(e) => { setPayment(e.target.value); setSaved(false); }} placeholder={defaults.paymentTerms}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink-4 focus:border-brand-line" />
        </div>
        <div>
          <FieldLabel>Notes</FieldLabel>
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} rows={2} placeholder="e.g. tender penalty clauses, negotiated LD caps…"
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-2 outline-none placeholder:text-ink-4 focus:border-brand-line" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-4">
            <Percent className="h-3 w-3" />{hasOverrides ? "Custom terms active" : "Inheriting all defaults"}
          </span>
          <button onClick={save} disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-brand-ink disabled:opacity-50">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : saved ? "Saved" : "Save terms"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function NumField({ label, suffix, value, onChange, placeholder }: { label: string; suffix: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between"><span className="text-[11.5px] font-semibold text-ink-2">{label}</span><span className="text-[10px] text-ink-4">{suffix}</span></div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="tnum w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-right font-mono text-[13px] text-ink outline-none placeholder:font-sans placeholder:text-ink-4 focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
    </div>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11.5px] font-semibold text-ink-2">{children}</label>;
}
