import { apiError, ok, parseRequestData } from "@/lib/api";
import { markProviderAlertRead } from "@/lib/clinical-store";
import { requireProviderSession } from "@/lib/provider-auth";

export async function POST(request: Request) {
  try {
    const session = requireProviderSession(request);
    const body = await parseRequestData(request);
    const alertId = typeof body.alertId === "string" ? body.alertId : "";

    const result = await markProviderAlertRead(
      { alertId },
      {
        actorId: session.providerId,
        email: session.email,
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          undefined,
        role: "therapist",
      },
    );

    return ok(result);
  } catch (error) {
    return apiError(error);
  }
}
