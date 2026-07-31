"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { registerTenant } from "@/app/actions/auth";

export function RegisterForm() {
  const [f, setF] = useState({ company: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.set(k, v));
      const res = await registerTenant(fd);
      if (res?.error) setError(res.error);
    });
  };

  const cls = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft";

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div>
        <label className="text-[12px] font-semibold text-ink-2">Company name</label>
        <input value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Meridian Transformers Pvt. Ltd." className={cls} />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-ink-2">Your name</label>
        <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" className={cls} />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-ink-2">Work email</label>
        <input value={f.email} onChange={(e) => set("email", e.target.value)} type="email" placeholder="you@company.com" className={cls} />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-ink-2">Password</label>
        <input value={f.password} onChange={(e) => set("password", e.target.value)} type="password" placeholder="At least 6 characters" className={cls} />
      </div>

      {error && <div className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">{error}</div>}

      <button type="submit" disabled={pending}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2.5 text-[13.5px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink disabled:opacity-50">
        <UserPlus className="h-4 w-4" /> {pending ? "Creating workspace…" : "Create workspace"}
      </button>
      <p className="text-[11px] text-ink-4">You become the admin of a fresh, empty tenant — isolated from every other company on the platform.</p>
    </form>
  );
}
