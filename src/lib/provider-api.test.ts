import { describe, expect, it } from "vitest";
import { GET as getNotionStatus } from "@/app/api/notion/status/route";
import { GET as getProviderPractice } from "@/app/api/provider/practice/route";

describe("provider API protection", () => {
  it("rejects provider practice reads without a signed session cookie", async () => {
    const response = await getProviderPractice(new Request("http://localhost/api/provider/practice"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Provider login required" });
  });

  it("rejects Notion OS status reads without a signed session cookie", async () => {
    const response = await getNotionStatus(new Request("http://localhost/api/notion/status"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Provider login required" });
  });
});
