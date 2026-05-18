import { afterEach, describe, expect, it } from "vitest";
import { alertConfigStatus, buildProviderAlert, dispatchProviderAlert } from "./alerting";

const originalEnv = { ...process.env };

describe("provider alerting", () => {
  afterEach(() => {
    for (const key of [
      "CARDIGAN_ALERT_EMAIL_WEBHOOK_URL",
      "CARDIGAN_ALERT_NOTION_WEBHOOK_URL",
      "CARDIGAN_ALERT_SMS_WEBHOOK_URL",
      "CARDIGAN_ALERT_WEBHOOK_URL",
      "CARDIGAN_GOOGLE_VOICE_BUSINESS_NUMBER",
    ]) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it("builds generic provider alerts without PHI", () => {
    const alert = buildProviderAlert({ priority: "high", type: "message-created" });

    expect(alert.title).toBe("Cardigan secure update");
    expect(alert.body).toBe("You have a secure Cardigan update. Sign in to the portal to review it.");
    expect(JSON.stringify(alert).toLowerCase()).not.toContain("client@example.test");
    expect(JSON.stringify(alert).toLowerCase()).not.toContain("anxiety");
  });

  it("reports configured alert channels without exposing targets", () => {
    process.env.CARDIGAN_ALERT_SMS_WEBHOOK_URL = "https://alerts.example.test/sms";
    process.env.CARDIGAN_GOOGLE_VOICE_BUSINESS_NUMBER = "5550100";

    expect(alertConfigStatus()).toMatchObject({
      dashboard: true,
      googleVoiceNumberConfigured: true,
      smsWebhook: true,
    });
  });

  it("stores dashboard alerts even when no outbound webhooks are configured", async () => {
    const deliveries = await dispatchProviderAlert(
      buildProviderAlert({ priority: "high", type: "intake-submitted" }),
    );

    expect(deliveries[0]).toEqual({ channel: "dashboard", status: "stored" });
    expect(deliveries.some((delivery) => delivery.status === "skipped")).toBe(true);
  });
});
