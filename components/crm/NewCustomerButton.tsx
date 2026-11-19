"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, X } from "lucide-react";
import { createCustomer } from "@/app/actions/crm";
import { useModalA11y } from "@/components/ui/useModalA11y";

const blank = {
  name: "",
  type: "utility",
  city: "",
  state: "",
  country: "India",
  gstin: "",
  rating: "A",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
};

export function NewCustomerButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const router = useRouter();
  const close = () => !pending && setOpen(false);
  const dialogRef = useModalA11y(open, close);
  const set = (key: keyof typeof blank, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    if (!form.name.trim() || !form.city.trim() || !form.state.trim() || !form.contactName.trim() || !form.contactEmail.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await createCustomer(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setForm(blank);
      router.push(`/customers/${result.id}`);
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink">
        <Plus className="h-4 w-4" /> Add customer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm" onClick={close}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="new-customer-title" onClick={(event) => event.stopPropagation()}
            className="my-8 w-full max-w-2xl rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 id="new-customer-title" className="flex items-center gap-2 text-[15px] font-bold text-ink"><Building2 className="h-4 w-4 text-brand" /> Add customer</h2>
                <p className="text-[12px] text-ink-3">Create the company and its primary contact.</p>
              </div>
              <button onClick={close} disabled={pending} aria-label="Close dialog" className="text-ink-4 hover:text-ink disabled:opacity-40"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-5 p-5">
              <section>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-4">Company</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Customer name" required><input autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Company legal name" className={inputCls} /></Field>
                  <Field label="Customer type" required>
                    <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                      <option value="utility">Utility</option><option value="epc">EPC</option><option value="industrial">Industrial</option><option value="government">Government</option><option value="export">Export</option>
                    </select>
                  </Field>
                  <Field label="City" required><input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} /></Field>
                  <Field label="State" required><input value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} /></Field>
                  <Field label="Country" required><input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} /></Field>
                  <Field label="GSTIN / Tax ID"><input value={form.gstin} onChange={(e) => set("gstin", e.target.value)} placeholder="Optional" className={inputCls} /></Field>
                  <Field label="Rating"><select value={form.rating} onChange={(e) => set("rating", e.target.value)} className={inputCls}><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></Field>
                </div>
              </section>

              <section className="border-t border-line-2 pt-4">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-4">Primary contact</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Contact name" required><input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputCls} /></Field>
                  <Field label="Role"><input value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="e.g. Procurement Manager" className={inputCls} /></Field>
                  <Field label="Email" required><input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputCls} /></Field>
                  <Field label="Phone"><input type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputCls} /></Field>
                </div>
              </section>
            </div>

            {error && <div role="alert" className="mx-5 mb-3 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">{error}</div>}
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={close} disabled={pending} className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-3 disabled:opacity-40">Cancel</button>
              <button onClick={submit} disabled={pending || !form.name.trim() || !form.city.trim() || !form.state.trim() || !form.contactName.trim() || !form.contactEmail.trim()}
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40">
                {pending ? "Adding…" : "Add customer"}
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
  return <label className="text-[11.5px] font-semibold text-ink-2">{label}{required && <span className="text-danger"> *</span>}{children}</label>;
}
