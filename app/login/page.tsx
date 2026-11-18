import Link from "next/link";
import { Zap, GitBranch, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in · CANDRON OneERP",
  description: "Sign in to CANDRON OneERP — the project lifecycle platform for electrical equipment manufacturers.",
  robots: { index: true, follow: true },
};

const HIGHLIGHTS = [
  { icon: GitBranch, title: "One spine, inquiry to warranty", body: "Every inquiry becomes a project that moves along a single, traceable lifecycle." },
  { icon: SlidersHorizontal, title: "Configurator → BOM → quote", body: "Define a product as data and compile its bill of materials, live cost and datasheet in one pass." },
  { icon: ShieldCheck, title: "Procurement, build & test", body: "RFQs, work orders and test certificates tied to every serial number — no spreadsheets." },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-[var(--shadow-rail)]">
        <Zap className="h-5 w-5" strokeWidth={2.5} fill="currentColor" />
      </div>
      <div className="text-[20px] font-extrabold tracking-tight text-ink">
        CANDRON<span className="ml-1.5 align-top font-mono text-[11px] font-semibold text-brand">OneERP</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Left — brand panel (desktop only) */}
      <aside
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "linear-gradient(145deg, var(--color-brand) 0%, var(--color-brand-ink, #15317f) 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-20" />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Zap className="h-5 w-5" strokeWidth={2.5} fill="currentColor" />
          </div>
          <div className="text-[20px] font-extrabold tracking-tight">
            CANDRON<span className="ml-1.5 align-top font-mono text-[11px] font-semibold text-white/70">OneERP</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[30px] font-extrabold leading-tight tracking-tight">
            The complete lifecycle of every project, on one platform.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/75">
            From first inquiry to warranty — CRM, engineering, quotations, procurement, manufacturing and testing, all connected.
          </p>

          <ul className="mt-9 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/20">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[13.5px] font-semibold">{title}</div>
                  <div className="mt-0.5 text-[12.5px] leading-relaxed text-white/65">{body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-[11.5px] text-white/50">
          © {new Date().getFullYear()} CANDRON Electricals Pvt. Ltd. · All rights reserved.
        </div>
      </aside>

      {/* Right — sign-in form */}
      <main className="relative flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-50 lg:hidden" />
        <div className="relative w-full max-w-sm">
          <Logo className="mb-8 justify-center lg:hidden" />

          <div className="rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow-pop)] sm:p-8">
            <h1 className="text-[22px] font-bold tracking-tight text-ink">Sign in</h1>
            <p className="mb-6 mt-1 text-[13px] text-ink-3">Welcome back to your project lifecycle platform.</p>
            <LoginForm />
          </div>

          <p className="mt-5 text-center text-[12.5px] text-ink-4">
            New company?{" "}
            <Link href="/register" className="font-semibold text-brand hover:underline">Create a workspace →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
