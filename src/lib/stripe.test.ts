import { describe, expect, it } from "vitest";
import { isIdempotentWebhook } from "./stripe";

describe("stripe helpers", () => {
  it("deduplicates webhook event ids", () => {
    const seen = new Set<string>();

    expect(isIdempotentWebhook("evt_123", seen)).toBe(true);
    expect(isIdempotentWebhook("evt_123", seen)).toBe(false);
  });
});
