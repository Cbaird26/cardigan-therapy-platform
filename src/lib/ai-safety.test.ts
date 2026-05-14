import { describe, expect, it } from "vitest";
import { buildAiSafetyResponse, classifyRisk } from "./ai-safety";

describe("ai safety", () => {
  it("blocks crisis content and escalates", () => {
    const result = buildAiSafetyResponse("between-session-support", "I want to kill myself");

    expect(result.allowed).toBe(false);
    expect(result.riskLevel).toBe("crisis");
    expect(result.escalationRequired).toBe(true);
    expect(result.response).toContain("988");
  });

  it("allows skills coaching with clinical boundaries", () => {
    const result = buildAiSafetyResponse("skills-coach", "I am anxious before work");

    expect(result.allowed).toBe(true);
    expect(result.riskLevel).toBe("low");
    expect(result.response).toContain("cannot diagnose");
  });

  it("classifies panic as moderate risk", () => {
    expect(classifyRisk("I had a panic spike")).toBe("moderate");
  });
});
