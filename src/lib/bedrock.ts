import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { buildAiSafetyResponse } from "./ai-safety";
import type { AiMode } from "./types";

const modelId = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-5-sonnet-20241022-v2:0";

export async function generateGuardedAiReply(input: {
  mode: AiMode;
  message: string;
  region?: string;
}) {
  const safety = buildAiSafetyResponse(input.mode, input.message);

  if (!safety.allowed || !process.env.AWS_REGION) {
    return {
      configured: Boolean(process.env.AWS_REGION),
      safety,
      text: safety.response,
    };
  }

  const client = new BedrockRuntimeClient({ region: input.region ?? process.env.AWS_REGION });
  const command = new ConverseCommand({
    modelId,
    system: [
      {
        text: "You are a therapy platform skills companion. Do not diagnose, replace therapy, provide emergency care, or make treatment decisions. Keep replies brief, practical, and safety-first.",
      },
    ],
    messages: [
      {
        role: "user",
        content: [{ text: input.message }],
      },
    ],
  });

  const response = await client.send(command);
  const text = response.output?.message?.content?.[0]?.text ?? safety.response;

  return {
    configured: true,
    safety,
    text,
  };
}
