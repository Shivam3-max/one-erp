"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
import { logCommunication } from "@/app/actions/crm";

export function LogCommButton({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({ type: "email", subject: "", summary: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.subject.trim()) return;
    start(async () => {
      await logCommunication({ customerId, type: form.type, subject: form.subject.trim(), summary: form.summary.trim() });
      setForm({ type: "email", subject: "", summary: "" });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink-2 hover:bg-surface-3">
        <Send className="h-3.5 w-3.5" /> Log
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mt-24 w-full max-w-md rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-[14px] font-bold text-ink">Log communication</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-ink-4 hover:text-ink" /></button>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label className="text-[11.5px] font-semibold text-ink-2">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className={cls}>
                  {["email", "call", "meeting", "site-visit"].map((t) => <option key={t} value={t} className="capitalize">{t.replace("-", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-ink-2">Subject *</label>
                <input value={form.subject} onChange={(e) => set("subject", e.target.value)} autoFocus placeholder="e.g. Delivery schedule discussion" className={cls} />
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-ink-2">Summary</label>
                <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={3} placeholder="What was discussed…" className={cls} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-3">Cancel</button>
              <button onClick={submit} disabled={pending || !form.subject.trim()} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:opacity-50">
                {pending ? "Saving…" : "Log entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const cls = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft";
