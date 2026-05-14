import { apiError, ok } from "@/lib/api";
import { generateGuardedAiReply } from "@/lib/bedrock";
import { createAuditEvent } from "@/lib/compliance";
import { aiChatSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const chat = aiChatSchema.parse(await request.json());
    const reply = await generateGuardedAiReply({ mode: chat.mode, message: chat.message });
    const { safety } = reply;

    return ok({
      conversationId: crypto.randomUUID(),
      mode: chat.mode,
      savedToRecord: chat.consentedToSave && safety.allowed,
      reply: reply.text,
      bedrockConfigured: reply.configured,
      safety,
      audit: createAuditEvent({
        actorRole: "client",
        action: safety.escalationRequired ? "ai.escalated" : "ai.responded",
        resourceType: "AIConversation",
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
