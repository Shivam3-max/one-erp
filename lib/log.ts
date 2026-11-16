/**
 * Minimal isomorphic structured logger.
 *
 * - Production: one JSON object per line (easy to ship to a log aggregator).
 * - Development: readable console output.
 *
 * `captureException` is the single hook to forward errors to a tracker
 * (e.g. Sentry). Wire the integration here and the whole app benefits — nothing
 * else needs to change.
 */

type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const isProd = process.env.NODE_ENV === "production";

function emit(level: Level, message: string, fields?: Fields) {
  if (isProd) {
    const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...fields });
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
  } else {
    const rest = fields && Object.keys(fields).length ? fields : "";
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(`[${level}] ${message}`, rest);
  }
}

export const log = {
  info: (message: string, fields?: Fields) => emit("info", message, fields),
  warn: (message: string, fields?: Fields) => emit("warn", message, fields),
  error: (message: string, fields?: Fields) => emit("error", message, fields),
};

/** Record an exception. Logs it, and forwards to an error tracker when wired. */
export function captureException(err: unknown, context?: Fields) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  emit("error", message, { ...context, stack });

  // Integration point: if a tracker exposes a global capture fn, forward to it.
  // e.g. Sentry's browser/node SDK sets Sentry.captureException.
  const globalCapture = (globalThis as { __captureException?: (e: unknown, c?: Fields) => void }).__captureException;
  if (typeof globalCapture === "function") {
    try { globalCapture(err, context); } catch { /* never let logging throw */ }
  }
}
