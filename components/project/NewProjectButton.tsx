"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createProject } from "@/app/actions/projects";

export function NewProjectButton({ customers }: { customers: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", customerId: customers[0]?.id ?? "", productSummary: "",
    location: "", valueCr: "", priority: "medium", targetDelivery: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.title.trim() || !form.customerId) return;
    startTransition(async () => {
      const { id } = await createProject({
        title: form.title.trim(),
        customerId: form.customerId,
        productSummary: form.productSummary.trim() || "To be configured",
        location: form.location.trim() || "—",
        valueCr: parseFloat(form.valueCr) || 0,
        priority: form.priority,
        targetDelivery: form.targetDelivery || undefined,
      });
      setOpen(false);
      router.push(`/projects/${id}`);
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink">
        <Plus className="h-4 w-4" strokeWidth={2.5} /> New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="mt-16 w-full max-w-lg rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-bold text-ink">New Project</h2>
                <p className="text-[12px] text-ink-3">Every inquiry becomes a project on the spine, starting at Lead.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-4 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3.5 p-5">
              <Field label="Project title" required>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus
                  placeholder="e.g. MSEDCL — Pune Feeder Package" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Customer" required>
                  <select value={form.customerId} onChange={(e) => set("customerId", e.target.value)} className={inputCls}>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
                    {["low", "medium", "high", "critical"].map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Product summary">
                <input value={form.productSummary} onChange={(e) => set("productSummary", e.target.value)}
                  placeholder="e.g. 2 × 5 MVA 33/11 kV Power Transformers" className={inputCls} />
              </Field>
              <div className="grid grid-cols-3 gap-3.5">
                <Field label="Location">
                  <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, State" className={inputCls} />
                </Field>
                <Field label="Value (₹ Cr)">
                  <input value={form.valueCr} onChange={(e) => set("valueCr", e.target.value)} type="number" step="0.1" placeholder="0.0" className={inputCls} />
                </Field>
                <Field label="Target delivery">
                  <input value={form.targetDelivery} onChange={(e) => set("targetDelivery", e.target.value)} type="date" className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={() => setOpen(false)} disabled={pending}
                className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-3">Cancel</button>
              <button onClick={submit} disabled={pending || !form.title.trim()}
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:opacity-50">
                {pending ? "Creating…" : "Create project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11.5px] font-semibold text-ink-2">{label}{required && <span className="text-danger"> *</span>}</label>
      {children}
    </div>
  );
}
