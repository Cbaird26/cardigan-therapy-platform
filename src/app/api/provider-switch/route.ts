import { apiError, ok } from "@/lib/api";
import { createAuditEvent } from "@/lib/compliance";
import { providerSwitchSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const switchRequest = providerSwitchSchema.parse(await request.json());

    return ok(
      {
        switchRequestId: crypto.randomUUID(),
        ...switchRequest,
        status: "admin-review",
        audit: createAuditEvent({
          actorRole: "client",
          action: "provider_switch.requested",
          resourceType: "ProviderSwitchRequest",
        }),
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
