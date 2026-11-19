import { describe, it, expect } from "vitest";
import { can, permsFor, ALL_PERMS } from "@/lib/permissions";

describe("permissions.can", () => {
  it("admin and director can do everything", () => {
    for (const perm of ALL_PERMS) {
      expect(can({ accessLevel: "admin" }, perm)).toBe(true);
      expect(can({ accessLevel: "director" }, perm)).toBe(true);
    }
    expect(permsFor("admin")).toEqual(ALL_PERMS);
    expect(permsFor("director")).toEqual(ALL_PERMS);
  });

  it("viewer can do nothing", () => {
    for (const perm of ALL_PERMS) {
      expect(can({ accessLevel: "viewer" }, perm)).toBe(false);
    }
  });

  it("member cannot manage settings or issue/approve quotations", () => {
    const member = { accessLevel: "member" };
    expect(can(member, "settings.manage")).toBe(false);
    expect(can(member, "quotation.issue")).toBe(false);
    expect(can(member, "quotation.approve")).toBe(false);
    expect(can(member, "project.create")).toBe(true);
  });

  it("manager can manage CRM and procurement but not settings", () => {
    const manager = { accessLevel: "manager" };
    expect(can(manager, "crm.manage")).toBe(true);
    expect(can(manager, "procurement.manage")).toBe(true);
    expect(can(manager, "settings.manage")).toBe(false);
  });

  it("null/undefined user is denied", () => {
    expect(can(null, "project.create")).toBe(false);
    expect(can(undefined, "project.create")).toBe(false);
  });

  it("unknown role has no permissions", () => {
    expect(permsFor("nonsense")).toEqual([]);
  });
});
