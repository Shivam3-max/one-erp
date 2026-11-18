import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create workspace · CANDRON OneERP",
  description: "Create your company workspace on CANDRON OneERP — manage the full project lifecycle from inquiry to warranty.",
  robots: { index: true, follow: true },
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-7 flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/candron-logo.png" alt="CANDRON Energy Inc." className="h-8 w-auto" />
            <span className="font-mono text-[10.5px] font-semibold text-ink-4">OneERP</span>
          </div>

          <div className="rounded-xl border border-line bg-surface px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_28px_-16px_rgba(16,24,40,0.18)]">
            <h1 className="text-[17px] font-bold tracking-tight text-ink">Create your workspace</h1>
            <p className="mb-5 mt-1 text-[12.5px] text-ink-3">Onboard your company as a new tenant.</p>
            <RegisterForm />
          </div>

          <p className="mt-5 text-center text-[12px] text-ink-4">
            Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
          </p>
        </div>
      </main>

      <footer className="px-4 py-5 text-center text-[11px] text-ink-4">
        © {new Date().getFullYear()} CANDRON Electricals Pvt. Ltd. · Project Lifecycle Platform
      </footer>
    </div>
  );
}
