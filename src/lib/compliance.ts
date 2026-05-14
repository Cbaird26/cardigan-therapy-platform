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
}) {
  return {
    ...input,
    createdAt: new Date().toISOString(),
  };
}
