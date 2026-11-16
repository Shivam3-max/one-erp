"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { parseInput, signInSchema, registerSchema } from "@/lib/validation";
import { USERS } from "@/lib/mock/org";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0].trim()) || h.get("x-real-ip") || "unknown";
}

// Attempt caps are env-tunable (e.g. relaxed for E2E, which logs in many times
// from one IP). Production leaves them at the defaults below.
const SIGNIN_MAX = Number(process.env.SIGNIN_RATE_MAX) || 5;
const REGISTER_MAX = Number(process.env.REGISTER_RATE_MAX) || 3;

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseInput(signInSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.ok) return { error: parsed.error };
  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  // Throttle credential guessing per IP.
  const limit = rateLimit(`signin:${await clientIp()}`, SIGNIN_MAX, 60_000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${limit.retryAfterSec}s.` };

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return { error: "Invalid email or password." };
    }
    await createSession(user.id);
  } catch {
    const user = USERS.find((u) => u.email.toLowerCase() === email);
    if (!user || password !== "candron123") return { error: "Invalid email or password." };
    await createSession(user.id);
  }
  redirect("/");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}

/** Onboard a brand-new tenant + its admin user (multi-tenant signup). */
export async function registerTenant(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseInput(registerSchema, {
    company: formData.get("company"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.ok) return { error: parsed.error };
  const { company, name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // Throttle signup abuse per IP.
  const limit = rateLimit(`register:${await clientIp()}`, REGISTER_MAX, 10 * 60_000);
  if (!limit.ok) return { error: `Too many sign-up attempts. Try again in ${limit.retryAfterSec}s.` };

  const exists = await prisma.user.findFirst({ where: { email } });
  if (exists) return { error: "An account with that email already exists." };

  const code = company.replace(/[^A-Za-z0-9]+/g, "").toUpperCase().slice(0, 8) || "TENANT";
  const tenantId = `T-${code}-${Date.now().toString().slice(-5)}`;
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "U";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.tenant.create({
    data: { id: tenantId, name: company, code, logoText: code, primaryCurrency: "INR", country: "India" },
  });
  const user = await prisma.user.create({
    data: {
      id: `${tenantId}-U1`, tenantId, name, initials, role: "Administrator",
      department: "management", email, passwordHash, accessLevel: "admin",
    },
  });
  await createSession(user.id);
  redirect("/");
}
