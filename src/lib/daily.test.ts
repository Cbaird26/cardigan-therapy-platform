import { describe, expect, it } from "vitest";
import { createSafeDailyRoomName } from "./daily";

describe("daily integration", () => {
  it("creates non-PHI room names", () => {
    const roomName = createSafeDailyRoomName("session-for-jamie-smith-2026-05-13");

    expect(roomName).toMatch(/^cardigan-[a-f0-9]{10}-[a-f0-9]{24}$/);
    expect(roomName).not.toContain("jamie");
    expect(roomName).not.toContain("smith");
  });
});
