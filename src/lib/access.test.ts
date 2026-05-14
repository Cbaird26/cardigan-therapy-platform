import { describe, expect, it } from "vitest";
import { can, hasRequiredConsents, requirePermission } from "./access";

describe("access controls", () => {
  it("allows clients to use self-service app features", () => {
    expect(can("client", "ai:chat")).toBe(true);
    expect(can("client", "audit:read")).toBe(false);
  });

  it("throws when a role is missing permission", () => {
    expect(() => requirePermission("therapist", "billing:manage")).toThrow(/cannot perform/);
  });

  it("requires launch-critical consents", () => {
    expect(hasRequiredConsents(["TERMS", "PRIVACY", "TELEHEALTH", "PAYMENT"])).toBe(true);
    expect(hasRequiredConsents(["TERMS", "PRIVACY"])).toBe(false);
  });
});
