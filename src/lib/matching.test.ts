import { describe, expect, it } from "vitest";
import { computeMatchCandidates, isStateEligible } from "./matching";
import { defaultIntake, providers } from "./mock-data";

describe("matching", () => {
  it("scores Florida clients against licensed providers", () => {
    const matches = computeMatchCandidates(defaultIntake, providers);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.provider.displayName).toBe("Christopher Michael Baird");
    expect(matches[0]?.score).toBeGreaterThan(0);
  });

  it("does not match out-of-state clients during the Florida pilot", () => {
    const matches = computeMatchCandidates(
      {
        ...defaultIntake,
        clientState: "GA",
      },
      providers,
    );

    expect(matches).toHaveLength(0);
    expect(isStateEligible("GA", providers[0])).toBe(false);
  });

  it("requires client matching consent", () => {
    expect(
      computeMatchCandidates({ ...defaultIntake, consentedToMatch: false }, providers),
    ).toHaveLength(0);
  });
});
