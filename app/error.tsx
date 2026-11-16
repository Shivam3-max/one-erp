"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { captureException } from "@/lib/log";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: "route" });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-[18px] font-bold text-ink">Something went wrong</h1>
      <p className="mt-1.5 text-[13px] text-ink-3">
        This page couldn&apos;t be loaded. The error has been logged. You can try again, and if it keeps happening, contact your administrator.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-ink-4">Ref: {error.digest}</p>}
      <button onClick={reset}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink">
        <RotateCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
