import { apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { createSessionRequest } from "@/lib/clinical-store";
import { createDailyRoom, createSafeDailyRoomName } from "@/lib/daily";
import { featureGateMessage, isFeatureEnabled } from "@/lib/features";
import { sessionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "session:request");
    const session = sessionSchema.parse(await parseRequestData(request));
    const roomName = createSafeDailyRoomName(session.sessionId);
    const storedSession = await createSessionRequest(session, context, roomName);

    if (!isFeatureEnabled("video")) {
      return ok(
        {
          sessionId: storedSession.id,
          status: "requested",
          daily: null,
          videoStatus: "disabled",
          compliance: featureGateMessage("video"),
          recording: "disabled",
          storageMode: storedSession.storageMode,
        },
        201,
      );
    }

    const room = await createDailyRoom({
      sessionId: session.sessionId,
      startsAt: session.startsAt,
      expiresAt: session.endsAt,
    });

    return ok(
      {
        sessionId: storedSession.id,
        status: "scheduled",
        daily: room,
        recording: "disabled",
        storageMode: storedSession.storageMode,
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
