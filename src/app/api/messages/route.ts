import { apiError, ok } from "@/lib/api";
import { classifyRisk } from "@/lib/ai-safety";
import { createAuditEvent } from "@/lib/compliance";
import { messageSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const message = messageSchema.parse(await request.json());
    const riskLevel = classifyRisk(message.body);
    const escalated = riskLevel === "high" || riskLevel === "crisis";

    return ok(
      {
        messageId: crypto.randomUUID(),
        threadId: message.threadId,
        status: escalated ? "escalated-for-review" : "sent",
        riskLevel,
        audit: createAuditEvent({
          actorRole: "client",
          action: escalated ? "message.escalated" : "message.created",
          resourceType: "Message",
        }),
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
