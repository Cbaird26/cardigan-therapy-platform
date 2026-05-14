import type { AiMode, AiSafetyResult, RiskLevel } from "./types";

const crisisPatterns = [
  /\bkill myself\b/i,
  /\bsuicide\b/i,
  /\bend my life\b/i,
  /\bself-harm\b/i,
  /\bhurt myself\b/i,
  /\bcan'?t stay safe\b/i,
];

const highRiskPatterns = [
  /\bno reason to live\b/i,
  /\bwant to disappear\b/i,
  /\boverdose\b/i,
  /\bunsafe at home\b/i,
  /\babuse\b/i,
];

const clinicalBoundary =
  "I can help with reflection, grounding, and session preparation, but I cannot diagnose, provide emergency care, or replace your therapist.";

export function classifyRisk(input: string): RiskLevel {
  if (crisisPatterns.some((pattern) => pattern.test(input))) {
    return "crisis";
  }

  if (highRiskPatterns.some((pattern) => pattern.test(input))) {
    return "high";
  }

  if (/\bpanic\b|\btriggered\b|\bflashback\b/i.test(input)) {
    return "moderate";
  }

  if (/\bstressed\b|\banxious\b|\bsad\b/i.test(input)) {
    return "low";
  }

  return "none";
}

export function buildAiSafetyResponse(mode: AiMode, input: string): AiSafetyResult {
  const riskLevel = classifyRisk(input);
  const visibleToTherapist = mode === "between-session-support" || riskLevel !== "none";

  if (riskLevel === "crisis") {
    return {
      riskLevel,
      allowed: false,
      escalationRequired: true,
      visibleToTherapist: true,
      response:
        "This sounds urgent. Please call or text 988 now if you are in the U.S., call emergency services, or go to the nearest emergency room. I am also flagging this for clinical review in the platform.",
    };
  }

  if (riskLevel === "high") {
    return {
      riskLevel,
      allowed: true,
      escalationRequired: true,
      visibleToTherapist: true,
      response:
        "I can stay with short grounding steps, but this should be reviewed by your care team. If there is immediate danger, call 988 or emergency services now. Try naming five things you can see and move closer to another person or safer place if possible.",
    };
  }

  const modeResponse = {
    "intake-guide":
      "Let us turn this into matchable context: what is happening, how often it shows up, and what kind of support would feel useful first?",
    "skills-coach":
      "Try a 90-second reset: unclench your jaw, drop your shoulders, inhale for four, exhale for six, then name the next small action.",
    "between-session-support":
      "Capture the moment in three lines: what happened, what your body did, and what you want to bring to your therapist next session.",
  }[mode];

  return {
    riskLevel,
    allowed: true,
    escalationRequired: false,
    visibleToTherapist,
    response: `${clinicalBoundary} ${modeResponse}`,
  };
}
