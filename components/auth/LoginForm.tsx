"use client";

import { useState, useTransition } from "react";
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signIn } from "@/app/actions/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-semibold text-ink-2">Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
          <input
            id="email" value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" autoComplete="username" required placeholder="you@company.com"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-line focus:ring-2 focus:ring-brand-soft"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[12.5px] font-semibold text-ink-2">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
          <input
            id="password" value={password} onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-11 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-line focus:ring-2 focus:ring-brand-soft"
          />
          <button
            type="button" onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-surface-3 hover:text-ink-2"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2.5 text-[12.5px] font-medium text-danger">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <button
        type="submit" disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-[14px] font-semibold text-white shadow-[var(--shadow-rail)] transition-all hover:bg-brand-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" /> {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
