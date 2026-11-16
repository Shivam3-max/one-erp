import { describe, it, expect } from "vitest";
import {
  parseInput,
  signInSchema,
  registerSchema,
  createProjectSchema,
  logCommunicationSchema,
} from "@/lib/validation";

describe("signInSchema", () => {
  it("accepts a valid email + password", () => {
    const r = parseInput(signInSchema, { email: "a@b.com", password: "x" });
    expect(r.ok).toBe(true);
  });
  it("rejects an invalid email", () => {
    const r = parseInput(signInSchema, { email: "not-an-email", password: "x" });
    expect(r.ok).toBe(false);
  });
  it("rejects an empty password", () => {
    const r = parseInput(signInSchema, { email: "a@b.com", password: "" });
    expect(r.ok).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires a password of at least 6 chars", () => {
    const base = { company: "Acme", name: "Pat", email: "p@acme.com" };
    expect(parseInput(registerSchema, { ...base, password: "12345" }).ok).toBe(false);
    expect(parseInput(registerSchema, { ...base, password: "123456" }).ok).toBe(true);
  });
});

describe("createProjectSchema", () => {
  it("applies defaults and coerces valueCr", () => {
    const r = parseInput(createProjectSchema, { title: "P", customerId: "C-01", valueCr: "2.5" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.valueCr).toBe(2.5);
      expect(r.data.priority).toBe("medium");
      expect(r.data.productSummary).toBe("To be configured");
    }
  });
  it("rejects a blank title and an invalid priority", () => {
    expect(parseInput(createProjectSchema, { title: "", customerId: "C-01" }).ok).toBe(false);
    expect(parseInput(createProjectSchema, { title: "P", customerId: "C-01", priority: "urgent" }).ok).toBe(false);
  });
  it("rejects a negative value", () => {
    expect(parseInput(createProjectSchema, { title: "P", customerId: "C-01", valueCr: -1 }).ok).toBe(false);
  });
});

describe("logCommunicationSchema", () => {
  it("requires subject and a known type", () => {
    expect(parseInput(logCommunicationSchema, { customerId: "C-01", type: "email", subject: "Hi" }).ok).toBe(true);
    expect(parseInput(logCommunicationSchema, { customerId: "C-01", type: "email", subject: "" }).ok).toBe(false);
    expect(parseInput(logCommunicationSchema, { customerId: "C-01", type: "carrier-pigeon", subject: "Hi" }).ok).toBe(false);
  });
});
