import { apiError, ok } from "@/lib/api";
import { isIdempotentWebhook } from "@/lib/stripe";

const seenEvents = new Set<string>();

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as { id?: string; type?: string };
    const eventId = event.id ?? crypto.randomUUID();
    const accepted = isIdempotentWebhook(eventId, seenEvents);

    return ok({
      accepted,
      eventId,
      type: event.type ?? "unknown",
      action: accepted ? "queued-membership-sync" : "ignored-duplicate",
    });
  } catch (error) {
    return apiError(error);
  }
}
