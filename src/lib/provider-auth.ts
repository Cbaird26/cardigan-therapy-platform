import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "./api";
import type { RequestContext } from "./auth";

export const PROVIDER_SESSION_COOKIE = "cardigan_provider_session";
export const PROVIDER_ID = "provider-cmb";

const DEFAULT_PROVIDER_EMAIL = "christopher@cardiganincorporated.com";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type ProviderSession = {
  displayName: string;
  email: string;
  expiresAt: number;
  issuedAt: number;
  providerId: string;
  role: "therapist";
};

function configuredProviderEmail() {
  return process.env.CARDIGAN_PROVIDER_EMAIL ?? DEFAULT_PROVIDER_EMAIL;
}

function configuredProviderPasscode() {
  return process.env.CARDIGAN_PROVIDER_PASSCODE;
}

function sessionSecret() {
  if (process.env.CARDIGAN_SESSION_SECRET) {
    return process.env.CARDIGAN_SESSION_SECRET;
  }

  throw new Error("CARDIGAN_SESSION_SECRET is required.");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function cookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const prefix = `${name}=`;
  const match = cookies.find((item) => item.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

export function providerAuthDefaults() {
  return {
    email: configuredProviderEmail(),
    passcodeConfigured: Boolean(process.env.CARDIGAN_PROVIDER_PASSCODE),
  };
}

export function validateProviderCredentials(input: { email: string; passcode: string }) {
  const passcode = configuredProviderPasscode();

  if (!passcode) {
    return false;
  }

  return (
    input.email.trim().toLowerCase() === configuredProviderEmail().toLowerCase() &&
    safeEqual(input.passcode, passcode)
  );
}

export function createProviderSessionToken(now = Date.now()) {
  const payload: ProviderSession = {
    displayName: "Christopher Michael Baird",
    email: configuredProviderEmail().toLowerCase(),
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
    issuedAt: now,
    providerId: PROVIDER_ID,
    role: "therapist",
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyProviderSessionToken(token: string | undefined, now = Date.now()) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra) {
    return null;
  }

  if (!safeEqual(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as ProviderSession;

    if (
      session.role !== "therapist" ||
      session.providerId !== PROVIDER_ID ||
      session.expiresAt <= now
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function providerSessionFromRequest(request: Request) {
  return verifyProviderSessionToken(cookieValue(request, PROVIDER_SESSION_COOKIE));
}

export function requireProviderSession(request: Request) {
  const session = providerSessionFromRequest(request);

  if (!session) {
    throw new HttpError(401, "Provider login required");
  }

  return session;
}

export function providerSessionContext(request: Request): RequestContext {
  const session = requireProviderSession(request);

  return contextFromProviderSession(request, session);
}

export function providerSessionContextIfPresent(request: Request): RequestContext | null {
  const session = providerSessionFromRequest(request);

  return session ? contextFromProviderSession(request, session) : null;
}

function contextFromProviderSession(request: Request, session: ProviderSession): RequestContext {
  return {
    actorId: session.providerId,
    email: session.email,
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined,
    role: "therapist",
  };
}

export function providerSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${PROVIDER_SESSION_COOKIE}=${encodeURIComponent(
    token,
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearProviderSessionCookie() {
  return `${PROVIDER_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
