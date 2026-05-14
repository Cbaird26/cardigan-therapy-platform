import { apiError, ok } from "@/lib/api";
import { createAuditEvent } from "@/lib/compliance";
import { noteSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const note = noteSchema.parse(await request.json());

    return ok(
      {
        noteId: crypto.randomUUID(),
        ...note,
        lockedAt: null,
        audit: createAuditEvent({
          actorRole: "therapist",
          action: "note.created",
          resourceType: "TherapistNote",
        }),
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
