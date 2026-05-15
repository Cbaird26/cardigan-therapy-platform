const blockedMetadataKeys = [
  "diagnosis",
  "condition",
  "symptom",
  "therapy",
  "therapist",
  "providerName",
  "clientName",
  "dateOfBirth",
  "notes",
  "concerns",
];

const blockedNotificationTerms = [
  "adhd",
  "anxiety",
  "client",
  "depression",
  "diagnosis",
  "panic",
  "session",
  "symptom",
  "therapist",
  "trauma",
];

export function assertNoPhiMetadata(metadata: Record<string, unknown>) {
  const keys = Object.keys(metadata);
  const blocked = keys.filter((key) => blockedMetadataKeys.includes(key));

  if (blocked.length > 0) {
    throw new Error(`PHI-like metadata keys are not allowed: ${blocked.join(", ")}`);
  }
}

export function safeBillingMetadata(input: { membershipId: string; planCode: string }) {
  const metadata = {
    membershipId: input.membershipId,
    planCode: input.planCode,
    productFamily: "cardigan-membership",
  };

  assertNoPhiMetadata(metadata);
  return metadata;
}

export function assertSafeNotificationText(message: string) {
  const lower = message.toLowerCase();
  const blocked = blockedNotificationTerms.filter((term) => lower.includes(term));
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(message);

  if (blocked.length > 0 || hasEmail) {
    throw new Error("Notification text cannot include PHI, clinical details, or direct identifiers.");
  }
}

export function createSafeNotification(input: { purpose: "intake-received" | "secure-update" }) {
  const notification = {
    purpose: input.purpose,
    subject: "Cardigan secure update",
    body: "You have a secure Cardigan update. Sign in to the portal to review it.",
  };

  assertSafeNotificationText(notification.subject);
  assertSafeNotificationText(notification.body);
  return notification;
}

export function redactForLogs(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
  }

  if (Array.isArray(value)) {
    return value.map(redactForLogs);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        blockedMetadataKeys.includes(key) ? "[redacted]" : redactForLogs(item),
      ]),
    );
  }

  return value;
}

export function createAuditEvent(input: {
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  return {
    ...input,
    metadata: input.metadata ? redactForLogs(input.metadata) : undefined,
    createdAt: new Date().toISOString(),
  };
}
