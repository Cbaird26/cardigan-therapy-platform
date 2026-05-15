import { HttpError } from "./api";
import { requirePermission } from "./access";
import type { UserRole } from "./types";

const userRoles = ["client", "therapist", "supervisor", "admin"] as const;

export type RequestContext = {
  actorId?: string;
  cognitoSub?: string;
  email?: string;
  ipAddress?: string;
  role: UserRole;
};

function normalizeRole(role: string | null): UserRole {
  const normalized = role?.trim().toLowerCase();

  if (userRoles.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }

  return "client";
}

export function getRequestContext(request: Request): RequestContext {
  return {
    actorId: request.headers.get("x-cardigan-user-id") ?? undefined,
    cognitoSub: request.headers.get("x-cardigan-cognito-sub") ?? undefined,
    email: request.headers.get("x-cardigan-email") ?? undefined,
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined,
    role: normalizeRole(request.headers.get("x-cardigan-role")),
  };
}

export function requireApiPermission(context: RequestContext, permission: string) {
  try {
    requirePermission(context.role, permission);
  } catch {
    throw new HttpError(403, "Forbidden");
  }
}

export function requireApiRole(context: RequestContext, roles: UserRole[]) {
  if (!roles.includes(context.role)) {
    throw new HttpError(403, "Forbidden");
  }
}
