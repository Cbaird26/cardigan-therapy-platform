import { beforeEach, describe, expect, it } from "vitest";
import type { RequestContext } from "./auth";
import {
  exportAuditEvents,
  getAdminIntakeSnapshot,
  getLaunchProviders,
  resetClinicalStoreForTests,
  submitOnboarding,
} from "./clinical-store";
import { onboardingSchema } from "./validators";

const context: RequestContext = {
  role: "client",
  ipAddress: "127.0.0.1",
};

describe("clinical store", () => {
  beforeEach(() => {
    process.env.CARDIGAN_DATA_STORE = "memory";
    resetClinicalStoreForTests();
  });

  it("keeps the public provider list to Christopher for v1", () => {
    expect(getLaunchProviders()).toHaveLength(1);
    expect(getLaunchProviders()[0]?.displayName).toBe("Christopher Michael Baird");
  });

  it("persists an intake, consent artifacts, match candidates, and an audit event", async () => {
    const intake = onboardingSchema.parse({
      acceptedPrivacy: true,
      acceptedTelehealth: true,
      acceptedTerms: true,
      ageRange: "adult",
      clientState: "FL",
      consentedToMatch: true,
      concerns: ["anxiety", "trauma"],
      email: "client@example.test",
      legalName: "Client Person",
      modalityPreference: "emdr",
      schedulePreference: "evening",
      wantsAiSupport: false,
    });

    const result = await submitOnboarding(intake, context);
    const audit = await exportAuditEvents();
    const admin = await getAdminIntakeSnapshot();

    expect(result.status).toBe("admin-review");
    expect(result.matches).toHaveLength(1);
    expect(result.consents).toEqual(["TERMS", "PRIVACY", "TELEHEALTH"]);
    expect(result.storageMode).toBe("memory");
    expect(audit.events).toHaveLength(1);
    expect(admin.intakes).toHaveLength(1);
    expect(JSON.stringify(audit.events)).not.toContain("client@example.test");
  });

  it("routes out-of-state intakes to out-of-state status without matches", async () => {
    const intake = onboardingSchema.parse({
      acceptedPrivacy: true,
      acceptedTelehealth: true,
      acceptedTerms: true,
      ageRange: "adult",
      clientState: "GA",
      consentedToMatch: true,
      concerns: ["stress"],
      email: "client@example.test",
      legalName: "Client Person",
      modalityPreference: "skills",
      schedulePreference: "weekday",
      wantsAiSupport: false,
    });

    const result = await submitOnboarding(intake, context);

    expect(result.status).toBe("out-of-state");
    expect(result.matches).toHaveLength(0);
  });
});
