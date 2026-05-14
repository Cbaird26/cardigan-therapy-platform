import type { UserRole } from "./types";

const permissions: Record<UserRole, string[]> = {
  client: ["client:read-self", "message:create", "session:join", "ai:chat"],
  therapist: ["client:read-assigned", "message:create", "session:manage", "note:create"],
  supervisor: ["client:read-assigned", "provider:supervise", "note:review", "audit:read-limited"],
  admin: ["client:read-all", "provider:manage", "billing:manage", "audit:read", "match:override"],
};

export function can(role: UserRole, permission: string) {
  return permissions[role].includes(permission);
}

export function requirePermission(role: UserRole, permission: string) {
  if (!can(role, permission)) {
    throw new Error(`Role ${role} cannot perform ${permission}`);
  }
}

export function hasRequiredConsents(consents: string[]) {
  const required = ["TERMS", "PRIVACY", "TELEHEALTH", "PAYMENT"];
  return required.every((consent) => consents.includes(consent));
}
