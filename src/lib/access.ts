import type { UserRole } from "./types";

const permissions: Record<UserRole, string[]> = {
  client: [
    "assessment:create",
    "ai:chat",
    "billing:checkout",
    "client:read-self",
    "consent:sign",
    "intake:create",
    "message:create",
    "provider-switch:create",
    "session:join",
    "session:request",
  ],
  therapist: [
    "client:read-assigned",
    "message:create",
    "note:create",
    "session:join",
    "session:manage",
    "session:request",
  ],
  supervisor: [
    "audit:read-limited",
    "client:read-assigned",
    "note:review",
    "provider:supervise",
  ],
  admin: [
    "audit:read",
    "billing:checkout",
    "billing:manage",
    "client:read-all",
    "intake:read",
    "match:override",
    "provider:manage",
    "session:manage",
    "session:request",
  ],
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
