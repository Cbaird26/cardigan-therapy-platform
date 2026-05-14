import { apiError, ok } from "@/lib/api";
import { createAuditEvent } from "@/lib/compliance";
import { computeMatchCandidates } from "@/lib/matching";
import { providers } from "@/lib/mock-data";
import { intakeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const intake = intakeSchema.parse(await request.json());
    const matches = computeMatchCandidates(intake, providers).slice(0, 3);

    return ok(
      {
        intakeId: crypto.randomUUID(),
        status: intake.clientState === "FL" ? "match-ready" : "out-of-state",
        matches,
        audit: createAuditEvent({
          actorRole: "client",
          action: "intake.submitted",
          resourceType: "IntakeResponse",
        }),
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
