import { z } from "zod";

const concerns = [
  "anxiety",
  "trauma",
  "stress",
  "depression",
  "grief",
  "family",
  "adhd",
  "life-transitions",
] as const;

export const intakeSchema = z.object({
  clientState: z.string().length(2).default("FL"),
  ageRange: z.enum(["child", "teen", "adult"]),
  concerns: z.array(z.enum(concerns)).min(1),
  modalityPreference: z.enum(["emdr", "cbt", "dbt", "family", "skills", "unsure"]),
  schedulePreference: z.enum(["weekday", "evening", "weekend", "flexible"]),
  wantsAiSupport: z.boolean().default(false),
  consentedToMatch: z.boolean(),
});

export const aiChatSchema = z.object({
  clientId: z.string().min(1),
  mode: z.enum(["intake-guide", "skills-coach", "between-session-support"]),
  message: z.string().min(1).max(4000),
  consentedToSave: z.boolean().default(false),
});

export const checkoutSchema = z.object({
  membershipId: z.string().min(1),
  planCode: z.string().min(1),
  priceId: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const sessionSchema = z.object({
  sessionId: z.string().min(1),
  clientId: z.string().min(1),
  providerId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const messageSchema = z.object({
  threadId: z.string().min(1),
  senderId: z.string().min(1),
  body: z.string().min(1).max(4000),
});

export const consentSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(["TERMS", "PRIVACY", "TELEHEALTH", "AI_COMPANION", "PAYMENT"]),
  version: z.string().min(1),
  documentHash: z.string().min(12),
});

export const assessmentSchema = z.object({
  clientId: z.string().min(1),
  type: z.string().min(2),
  score: z.number().int().optional(),
  payload: z.record(z.string(), z.unknown()),
});

export const noteSchema = z.object({
  clientId: z.string().min(1),
  providerId: z.string().min(1),
  sessionId: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const providerSwitchSchema = z.object({
  clientId: z.string().min(1),
  currentProviderId: z.string().min(1),
  preferredModalities: z
    .array(z.enum(["emdr", "cbt", "dbt", "family", "skills", "unsure"]))
    .default([]),
  reasonCode: z.enum(["fit", "availability", "specialty", "preference", "other"]),
});
