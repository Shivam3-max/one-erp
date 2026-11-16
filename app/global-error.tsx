"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/log";

// Catches errors thrown in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0b0d12", color: "#e6e8ee" }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
            The application failed to load. Please try again.
          </p>
          <button onClick={reset} style={{ marginTop: 20, padding: "8px 16px", borderRadius: 8, border: "none", background: "#2050e0", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
