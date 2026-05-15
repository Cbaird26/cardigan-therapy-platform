import { describe, expect, it } from "vitest";
import {
  assertNoPhiMetadata,
  assertSafeNotificationText,
  createSafeNotification,
  redactForLogs,
  safeBillingMetadata,
} from "./compliance";

describe("compliance helpers", () => {
  it("rejects PHI-like billing metadata keys", () => {
    expect(() =>
      assertNoPhiMetadata({
        membershipId: "mem_123",
        diagnosis: "anxiety",
      }),
    ).toThrow(/PHI-like/);
  });

  it("creates generic billing metadata", () => {
    expect(safeBillingMetadata({ membershipId: "mem_123", planCode: "care-weekly" })).toEqual({
      membershipId: "mem_123",
      planCode: "care-weekly",
      productFamily: "cardigan-membership",
    });
  });

  it("redacts emails and blocked keys from log payloads", () => {
    expect(
      redactForLogs({
        email: "person@example.com",
        notes: "private note",
      }),
    ).toEqual({
      email: "[redacted-email]",
      notes: "[redacted]",
    });
  });

  it("keeps notification text generic", () => {
    expect(createSafeNotification({ purpose: "intake-received" })).toEqual({
      purpose: "intake-received",
      subject: "Cardigan secure update",
      body: "You have a secure Cardigan update. Sign in to the portal to review it.",
    });
    expect(() => assertSafeNotificationText("Your anxiety session is ready")).toThrow(
      /Notification text/,
    );
  });
});
