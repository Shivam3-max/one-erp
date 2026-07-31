import Link from "next/link";
import { Zap } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in · CANDRON OneERP" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-60" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-[var(--shadow-rail)]">
            <Zap className="h-5 w-5" strokeWidth={2.5} fill="currentColor" />
          </div>
          <div className="text-[20px] font-extrabold tracking-tight text-ink">
            CANDRON<span className="ml-1.5 align-top font-mono text-[11px] font-semibold text-brand">OneERP</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-pop)]">
          <h1 className="text-[18px] font-bold tracking-tight text-ink">Sign in</h1>
          <p className="mb-4 mt-0.5 text-[12.5px] text-ink-3">Welcome back to your project lifecycle platform.</p>
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-[12px] text-ink-4">
          New company? <Link href="/register" className="font-semibold text-brand hover:underline">Create a workspace →</Link>
        </p>
      </div>
    </div>
  );
}
