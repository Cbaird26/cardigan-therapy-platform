import { apiError, ok } from "@/lib/api";
import { createAuditEvent } from "@/lib/compliance";
import { assessmentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const assessment = assessmentSchema.parse(await request.json());

    return ok(
      {
        assessmentId: crypto.randomUUID(),
        ...assessment,
        recordedAt: new Date().toISOString(),
        audit: createAuditEvent({
          actorRole: "client",
          action: "assessment.created",
          resourceType: "Assessment",
        }),
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
