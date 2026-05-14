import { apiError, ok } from "@/lib/api";
import { createAuditEvent } from "@/lib/compliance";
import { consentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const consent = consentSchema.parse(await request.json());

    return ok(
      {
        consentId: crypto.randomUUID(),
        ...consent,
        signedAt: new Date().toISOString(),
        audit: createAuditEvent({
          actorRole: "client",
          action: "consent.signed",
          resourceType: "ConsentArtifact",
        }),
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
