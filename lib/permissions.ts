/**
 * RBAC — coarse permission model.
 * accessLevel on the user maps to a set of permissions; server actions and UI
 * both consult can(). "admin"/"director" get everything.
 */

export type Perm =
  | "project.create"
  | "project.advance"
  | "config.save"
  | "quotation.create"
  | "quotation.issue"
  | "quotation.approve"
  | "procurement.manage"
  | "manufacturing.manage"
  | "testing.manage"
  | "crm.manage"
  | "settings.manage";

export const ALL_PERMS: Perm[] = [
  "project.create", "project.advance", "config.save", "quotation.create",
  "quotation.issue", "quotation.approve", "procurement.manage", "manufacturing.manage",
  "testing.manage", "crm.manage", "settings.manage",
];

const ROLE_PERMS: Record<string, Perm[] | "*"> = {
  admin: "*",
  director: "*",
  manager: [
    "project.create", "project.advance", "config.save", "quotation.create",
    "quotation.issue", "quotation.approve", "procurement.manage", "manufacturing.manage", "testing.manage", "crm.manage",
  ],
  member: [
    "project.create", "project.advance", "config.save", "quotation.create",
    "procurement.manage", "manufacturing.manage", "testing.manage", "crm.manage",
  ],
  viewer: [],
};

export const ACCESS_LEVELS = ["admin", "director", "manager", "member", "viewer"] as const;

export const ACCESS_LABEL: Record<string, string> = {
  admin: "Administrator",
  director: "Director",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer (read-only)",
};

export function can(user: { accessLevel: string } | null | undefined, perm: Perm): boolean {
  if (!user) return false;
  const perms = ROLE_PERMS[user.accessLevel] ?? [];
  return perms === "*" || perms.includes(perm);
}

/** Resolve the full permission set for a level — handy to pass to client components. */
export function permsFor(accessLevel: string): Perm[] {
  const perms = ROLE_PERMS[accessLevel] ?? [];
  return perms === "*" ? [...ALL_PERMS] : perms;
}
