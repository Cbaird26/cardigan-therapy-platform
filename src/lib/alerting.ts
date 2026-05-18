import { randomUUID } from "node:crypto";
import { assertSafeNotificationText, createSafeNotification, redactForLogs } from "./compliance";

export type ProviderAlertPriority = "normal" | "high" | "urgent";

export type ProviderAlertType =
  | "ai-escalated"
  | "assessment-created"
  | "intake-submitted"
  | "message-created"
  | "message-escalated"
  | "provider-switch-requested"
  | "session-requested";

export type AlertDeliveryStatus = {
  channel: "dashboard" | "email-webhook" | "sms-webhook" | "notion-webhook" | "webhook";
  status: "stored" | "sent" | "skipped" | "failed";
};

export type ProviderAlertRecord = {
  body: string;
  createdAt: string;
  deliveryStatus: AlertDeliveryStatus[];
  id: string;
  priority: ProviderAlertPriority;
  readAt?: string | null;
  route: string;
  title: string;
  type: ProviderAlertType;
};

type AlertWebhook = {
  channel: AlertDeliveryStatus["channel"];
  url?: string;
};

function configuredWebhooks(): AlertWebhook[] {
  return [
    { channel: "webhook", url: process.env.CARDIGAN_ALERT_WEBHOOK_URL },
    { channel: "email-webhook", url: process.env.CARDIGAN_ALERT_EMAIL_WEBHOOK_URL },
    { channel: "sms-webhook", url: process.env.CARDIGAN_ALERT_SMS_WEBHOOK_URL },
    { channel: "notion-webhook", url: process.env.CARDIGAN_ALERT_NOTION_WEBHOOK_URL },
  ];
}

export function alertConfigStatus() {
  return {
    dashboard: true,
    emailWebhook: Boolean(process.env.CARDIGAN_ALERT_EMAIL_WEBHOOK_URL),
    googleVoiceNumberConfigured: Boolean(process.env.CARDIGAN_GOOGLE_VOICE_BUSINESS_NUMBER),
    notionWebhook: Boolean(process.env.CARDIGAN_ALERT_NOTION_WEBHOOK_URL),
    smsWebhook: Boolean(process.env.CARDIGAN_ALERT_SMS_WEBHOOK_URL),
    webhook: Boolean(process.env.CARDIGAN_ALERT_WEBHOOK_URL),
  };
}

export function buildProviderAlert(input: {
  priority: ProviderAlertPriority;
  route?: string;
  type: ProviderAlertType;
}): ProviderAlertRecord {
  const notification = createSafeNotification({
    purpose: input.type === "intake-submitted" ? "intake-received" : "secure-update",
  });

  const alert = {
    body: notification.body,
    createdAt: new Date().toISOString(),
    deliveryStatus: [{ channel: "dashboard", status: "stored" }] satisfies AlertDeliveryStatus[],
    id: `alert_${randomUUID()}`,
    priority: input.priority,
    readAt: null,
    route: input.route ?? "/provider",
    title: notification.subject,
    type: input.type,
  };

  assertSafeNotificationText(alert.title);
  assertSafeNotificationText(alert.body);
  return alert;
}

function webhookPayload(alert: ProviderAlertRecord) {
  return {
    alertId: alert.id,
    body: alert.body,
    createdAt: alert.createdAt,
    priority: alert.priority,
    route: alert.route,
    title: alert.title,
  };
}

export async function dispatchProviderAlert(alert: ProviderAlertRecord) {
  const payload = webhookPayload(alert);
  const deliveries: AlertDeliveryStatus[] = [{ channel: "dashboard", status: "stored" }];

  for (const webhook of configuredWebhooks()) {
    if (!webhook.url) {
      deliveries.push({ channel: webhook.channel, status: "skipped" });
      continue;
    }

    try {
      const response = await fetch(webhook.url, {
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
          ...(process.env.CARDIGAN_ALERT_WEBHOOK_SECRET
            ? { "x-cardigan-alert-secret": process.env.CARDIGAN_ALERT_WEBHOOK_SECRET }
            : {}),
        },
        method: "POST",
      });

      deliveries.push({ channel: webhook.channel, status: response.ok ? "sent" : "failed" });
    } catch (error) {
      console.warn(
        "Cardigan alert delivery failed",
        redactForLogs({
          channel: webhook.channel,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
      deliveries.push({ channel: webhook.channel, status: "failed" });
    }
  }

  return deliveries;
}
