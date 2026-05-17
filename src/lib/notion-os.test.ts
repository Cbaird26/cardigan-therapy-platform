import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertNotionPayloadSafe,
  buildCompanyOsRecords,
  pullNotionOs,
  pushNotionOs,
  resetNotionOsForTests,
  resolveSyncConflict,
} from "./notion-os";
import { resetClinicalStoreForTests } from "./clinical-store";

describe("Notion Company OS sync", () => {
  beforeEach(() => {
    process.env.CARDIGAN_DATA_STORE = "memory";
    process.env.NOTION_TOKEN = "";
    resetClinicalStoreForTests();
    resetNotionOsForTests();
    vi.useRealTimers();
  });

  it("builds operating records without direct identifiers or clinical payloads", () => {
    const records = buildCompanyOsRecords({
      consultRequestCount: 2,
      lastEditedAt: "2026-05-17T12:00:00.000Z",
      openRiskFlagCount: 0,
      providerWorkspaceStatus: "In Progress",
    });
    const payload = JSON.stringify(records);

    expect(records).toHaveLength(8);
    expect(payload).not.toContain("@");
    expect(payload).not.toMatch(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
    expect(payload).not.toMatch(/\b(anxiety|adhd|depression|diagnosis|panic|trauma)\b/i);
  });

  it("rejects Notion payloads with identifiers or clinical fields", () => {
    expect(() => assertNotionPayloadSafe({ email: "client@example.test" })).toThrow(
      /PHI field: email/,
    );
    expect(() => assertNotionPayloadSafe({ title: "Trauma intake follow-up" })).toThrow(
      /cannot include PHI/,
    );
  });

  it("keeps local-to-Notion mappings stable across pushes", async () => {
    const first = await pushNotionOs();
    const second = await pushNotionOs();

    expect(first.syncedCount).toBe(8);
    expect(second.syncedCount).toBe(8);
    expect(second.status.mappings).toBe(8);
  });

  it("resolves conflicts by newest edit and writes pull logs", async () => {
    expect(
      resolveSyncConflict({
        lastSyncedAt: "2026-05-17T12:00:00.000Z",
        localLastEditedAt: "2026-05-17T12:01:00.000Z",
        remoteLastEditedAt: "2026-05-17T12:02:00.000Z",
      }),
    ).toBe("remote");

    await pushNotionOs();
    const pull = await pullNotionOs();

    expect(pull.pulledCount).toBe(8);
    expect(pull.status.logs[0]?.action).toBe("notion.sync.pull");
  });
});
