import { apiError, ok, parseRequestData } from "@/lib/api";
import { buildAiSafetyResponse } from "@/lib/ai-safety";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { generateGuardedAiReply } from "@/lib/bedrock";
import { recordAiConversation } from "@/lib/clinical-store";
import { featureGateMessage, isFeatureEnabled } from "@/lib/features";
import { aiChatSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "ai:chat");
    const chat = aiChatSchema.parse(await parseRequestData(request));

    if (!isFeatureEnabled("ai")) {
      const safety = buildAiSafetyResponse(chat.mode, chat.message);
      const stored = await recordAiConversation(chat, context, safety, safety.response);

      return ok({
        conversationId: stored.conversationId,
        mode: chat.mode,
        savedToRecord: false,
        status: "feature-disabled",
        reply: safety.escalationRequired ? safety.response : featureGateMessage("ai"),
        bedrockConfigured: false,
        safety,
        storageMode: stored.storageMode,
      });
    }

    const reply = await generateGuardedAiReply({ mode: chat.mode, message: chat.message });
    const { safety } = reply;
    const stored = await recordAiConversation(chat, context, safety, reply.text);

    return ok({
      conversationId: stored.conversationId,
      mode: chat.mode,
      savedToRecord: stored.savedToRecord,
      reply: reply.text,
      bedrockConfigured: reply.configured,
      safety,
      storageMode: stored.storageMode,
    });
  } catch (error) {
    return apiError(error);
  }
}
