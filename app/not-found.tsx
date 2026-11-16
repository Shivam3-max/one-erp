import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-3 text-ink-3">
        <FileQuestion className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-[18px] font-bold text-ink">Page not found</h1>
      <p className="mt-1.5 text-[13px] text-ink-3">
        The page or record you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink">
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>
    </div>
  );
}
