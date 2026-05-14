import { apiError, ok } from "@/lib/api";
import { createDailyRoom } from "@/lib/daily";
import { sessionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = sessionSchema.parse(await request.json());
    const room = await createDailyRoom({
      sessionId: session.sessionId,
      startsAt: session.startsAt,
      expiresAt: session.endsAt,
    });

    return ok(
      {
        sessionId: session.sessionId,
        status: "scheduled",
        daily: room,
        recording: "disabled",
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
