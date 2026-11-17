/**
 * Resolve the MySQL connection string.
 *
 * Precedence:
 *  1. DATABASE_URL (a full connection string) — used as-is when set.
 *  2. Discrete parts: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_PARAMS.
 *     This is the Hostinger shape — hPanel gives you a database name and user
 *     (often prefixed, e.g. u12345_oneerp) as separate fields.
 *
 * Shared by the running app (lib/db.ts) and the Prisma CLI wrapper
 * (scripts/with-db-url.mjs) so both compose the URL the same way.
 */
export function resolveDatabaseUrl(env = process.env) {
  if (env.DATABASE_URL && env.DATABASE_URL.trim()) return env.DATABASE_URL;

  const host = env.DB_HOST;
  const name = env.DB_NAME;
  const user = env.DB_USER;
  if (host && name && user) {
    const port = env.DB_PORT || "3306";
    const auth = env.DB_PASSWORD
      ? `${encodeURIComponent(user)}:${encodeURIComponent(env.DB_PASSWORD)}`
      : encodeURIComponent(user);
    const params = env.DB_PARAMS ? `?${env.DB_PARAMS}` : "";
    return `mysql://${auth}@${host}:${port}/${encodeURIComponent(name)}${params}`;
  }

  return undefined;
}
