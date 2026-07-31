"use client";

import { useState, useTransition } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "@/app/actions/auth";

const DEMO = [
  { label: "Director · admin", email: "meera@candron.in" },
  { label: "Commercial · manager", email: "vikram@candron.in" },
  { label: "Viewer · read-only", email: "viewer@candron.in" },
];

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("password", password);
      const res = await signIn(fd);
      if (res?.error) setError(res.error);
    });
  };

  const fill = (em: string) => { setEmail(em); setPassword("candron123"); };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div>
        <label className="text-[12px] font-semibold text-ink-2">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" placeholder="you@company.com"
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-ink-2">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••"
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft" />
      </div>

      {error && <div className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">{error}</div>}

      <button type="submit" disabled={pending}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2.5 text-[13.5px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink disabled:opacity-50">
        <LogIn className="h-4 w-4" /> {pending ? "Signing in…" : "Sign in"}
      </button>

      <div className="pt-1">
        <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-4">Demo accounts · password candron123</div>
        <div className="flex flex-wrap gap-1.5">
          {DEMO.map((d) => (
            <button key={d.email} type="button" onClick={() => fill(d.email)}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-ink-2 transition-colors hover:border-brand-line hover:bg-brand-soft hover:text-brand-ink">
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
