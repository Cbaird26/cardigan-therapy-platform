import type { IntakeProfile, MatchCandidate, Provider } from "./types";

const FLORIDA = "FL";

export function isStateEligible(clientState: string, provider: Provider) {
  return clientState.toUpperCase() === FLORIDA && provider.states.includes(FLORIDA);
}

export function computeMatchCandidates(
  intake: IntakeProfile,
  providers: Provider[],
): MatchCandidate[] {
  if (!intake.consentedToMatch) {
    return [];
  }

  return providers
    .filter((provider) => provider.acceptingClients)
    .filter((provider) => isStateEligible(intake.clientState, provider))
    .filter((provider) => intake.ageRange === "adult" || provider.acceptsMinors)
    .map((provider) => scoreProvider(intake, provider))
    .sort((a, b) => b.score - a.score);
}

export function scoreProvider(intake: IntakeProfile, provider: Provider): MatchCandidate {
  const reasons: string[] = [];
  let score = 40;

  const specialtyMatches = intake.concerns.filter((concern) =>
    provider.specialties.includes(concern),
  );

  if (specialtyMatches.length > 0) {
    score += specialtyMatches.length * 12;
    reasons.push(`Matches ${specialtyMatches.join(", ")} focus areas`);
  }

  if (provider.modalities.includes(intake.modalityPreference)) {
    score += 16;
    reasons.push(`Supports ${intake.modalityPreference.toUpperCase()} preference`);
  }

  if (intake.ageRange !== "adult" && provider.acceptsMinors) {
    score += 12;
    reasons.push("Accepts children and teens");
  }

  if (provider.sessionStyles.some((style) => /structured|skills|practical/i.test(style))) {
    score += 6;
    reasons.push("Uses structured between-session tools");
  }

  if (intake.wantsAiSupport) {
    score += 4;
    reasons.push("Compatible with AI-assisted journaling review");
  }

  return {
    provider,
    score: Math.min(score, 100),
    reasons,
  };
}
