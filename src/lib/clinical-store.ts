import { createHash, randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { classifyRisk } from "./ai-safety";
import {
  alertConfigStatus,
  buildProviderAlert,
  dispatchProviderAlert,
  type ProviderAlertPriority,
  type ProviderAlertRecord,
  type ProviderAlertType,
} from "./alerting";
import type { RequestContext } from "./auth";
import {
  createAuditEvent,
  createSafeNotification,
  redactForLogs,
} from "./compliance";
import { sessionEndsAt } from "./consult-slots";
import { createSafeDailyRoomName } from "./daily";
import { computeMatchCandidates } from "./matching";
import { providers } from "./mock-data";
import type { MatchCandidate, RiskLevel } from "./types";
import type {
  aiChatSchema,
  assessmentSchema,
  consentSchema,
  messageSchema,
  noteSchema,
  onboardingSchema,
  providerSwitchSchema,
  sessionSchema,
} from "./validators";
import type { z } from "zod";

const CLINICAL_LEAD_PROVIDER_ID = "provider-cmb";
const CLINICAL_LEAD_EMAIL =
  process.env.CARDIGAN_CLINICAL_LEAD_EMAIL ?? "christopher@cardiganincorporated.com";
const CONSENT_VERSION = "2026-05-v1";

type OnboardingInput = z.infer<typeof onboardingSchema>;
type ConsentInput = z.infer<typeof consentSchema>;
type MessageInput = z.infer<typeof messageSchema>;
type AssessmentInput = z.infer<typeof assessmentSchema>;
type NoteInput = z.infer<typeof noteSchema>;
type ProviderSwitchInput = z.infer<typeof providerSwitchSchema>;
type SessionInput = z.infer<typeof sessionSchema>;
type AiChatInput = z.infer<typeof aiChatSchema>;

type StorageMode = "memory" | "prisma";

type AuditRecord = ReturnType<typeof createAuditEvent> & {
  actorId?: string;
  id: string;
};

type StoredClient = {
  ageRange: string;
  concerns: string[];
  email: string;
  id: string;
  legalName: string;
  matchedProviderId?: string;
  modalityPreference: string;
  phone?: string;
  preferredName?: string;
  state: string;
  timezone: string;
  userId: string;
};

export type IntakeReviewStatus = "submitted" | "reviewed" | "accepted" | "needs-info" | "declined";

type StoredIntake = {
  answers: ReturnType<typeof intakeAnswers>;
  clientId: string;
  consentedToMatch: boolean;
  createdAt: string;
  id: string;
  reviewNote?: string;
  reviewStatus: IntakeReviewStatus;
  reviewedAt?: string;
  status: string;
};

type StoredThread = {
  clientId: string;
  id: string;
  providerId: string;
  status: "OPEN" | "ESCALATED";
};

type StoredPracticeRecord = Record<string, unknown> & {
  providerId?: string;
  status?: string;
};

type StoredProviderAlert = ProviderAlertRecord & {
  providerId: string;
};

type MemoryState = {
  assessments: Array<Record<string, unknown>>;
  aiConversations: Array<Record<string, unknown>>;
  auditEvents: AuditRecord[];
  consents: Array<Record<string, unknown>>;
  crisisFlags: StoredPracticeRecord[];
  intakes: StoredIntake[];
  matchCandidates: Array<Record<string, unknown>>;
  messages: Array<Record<string, unknown>>;
  notes: StoredPracticeRecord[];
  providerAlerts: StoredProviderAlert[];
  providerSwitches: Array<Record<string, unknown>>;
  sessions: StoredPracticeRecord[];
  threads: StoredThread[];
  clients: StoredClient[];
};

const globalStore = globalThis as typeof globalThis & {
  cardiganClinicalStore?: MemoryState;
};

function memoryStore(): MemoryState {
  globalStore.cardiganClinicalStore ??= {
    assessments: [],
    aiConversations: [],
    auditEvents: [],
    consents: [],
    crisisFlags: [],
    intakes: [],
    matchCandidates: [],
    messages: [],
    notes: [],
    providerAlerts: [],
    providerSwitches: [],
    sessions: [],
    threads: [],
    clients: [],
  };

  return globalStore.cardiganClinicalStore;
}

export function resetClinicalStoreForTests() {
  globalStore.cardiganClinicalStore = undefined;
}

export function getStorageMode(): StorageMode {
  if (process.env.CARDIGAN_DATA_STORE === "memory") {
    return "memory";
  }

  if (process.env.CARDIGAN_DATA_STORE === "prisma" || process.env.DATABASE_URL) {
    return "prisma";
  }

  return "memory";
}

export function getLaunchProviders() {
  return providers.filter((provider) => provider.id === CLINICAL_LEAD_PROVIDER_ID);
}

function mustUseDatabase() {
  return process.env.CARDIGAN_REQUIRE_DATABASE === "true";
}

function consentHash(type: string, version = CONSENT_VERSION) {
  return createHash("sha256")
    .update(`cardigan:${type}:${version}`)
    .digest("hex");
}

function intakeAnswers(input: OnboardingInput) {
  return {
    ageRange: input.ageRange,
    clientState: input.clientState,
    concerns: input.concerns,
    modalityPreference: input.modalityPreference,
    requestedSessionStartsAt: input.requestedSessionStartsAt,
    requestedSessionEndsAt: input.requestedSessionStartsAt
      ? sessionEndsAt(input.requestedSessionStartsAt)
      : undefined,
    schedulePreference: input.schedulePreference,
    wantsAiSupport: input.wantsAiSupport,
  };
}

function auditInput(input: {
  action: string;
  context: RequestContext;
  resourceId?: string;
  resourceType: string;
  metadata?: Record<string, unknown>;
}) {
  return createAuditEvent({
    actorRole: input.context.role,
    action: input.action,
    resourceId: input.resourceId,
    resourceType: input.resourceType,
    metadata: input.metadata,
    ipAddress: input.context.ipAddress,
  });
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function runWithStore<TPrisma, TMemory>(
  prismaOperation: () => Promise<TPrisma>,
  memoryOperation: () => Promise<TMemory>,
): Promise<TPrisma | TMemory> {
  if (getStorageMode() === "memory") {
    return memoryOperation();
  }

  try {
    return await prismaOperation();
  } catch (error) {
    if (mustUseDatabase()) {
      throw error;
    }

    return memoryOperation();
  }
}

async function ensureChristopherProviderPrisma() {
  const provider = getLaunchProviders()[0];

  const user = await prisma.user.upsert({
    where: { email: CLINICAL_LEAD_EMAIL },
    update: {
      displayName: provider.displayName,
      role: "THERAPIST",
    },
    create: {
      email: CLINICAL_LEAD_EMAIL,
      displayName: provider.displayName,
      role: "THERAPIST",
    },
  });

  return prisma.providerProfile.upsert({
    where: { id: provider.id },
    update: {
      acceptingClients: provider.acceptingClients,
      acceptsMinors: provider.acceptsMinors,
      bio: provider.bio,
      credentials: provider.credentials,
      modalities: provider.modalities,
      specialties: provider.specialties,
      states: provider.states,
      userId: user.id,
    },
    create: {
      id: provider.id,
      acceptingClients: provider.acceptingClients,
      acceptsMinors: provider.acceptsMinors,
      bio: provider.bio,
      credentials: provider.credentials,
      modalities: provider.modalities,
      specialties: provider.specialties,
      states: provider.states,
      userId: user.id,
    },
  });
}

async function createAuditPrisma(input: {
  action: string;
  context: RequestContext;
  resourceId?: string;
  resourceType: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditEvent.create({
    data: {
      action: input.action,
      actorId: input.context.actorId,
      actorRole: input.context.role.toUpperCase() as "CLIENT" | "THERAPIST" | "SUPERVISOR" | "ADMIN",
      ipAddress: input.context.ipAddress,
      metadata: input.metadata ? toPrismaJson(redactForLogs(input.metadata)) : undefined,
      resourceId: input.resourceId,
      resourceType: input.resourceType,
    },
  });
}

function createAuditMemory(input: {
  action: string;
  context: RequestContext;
  resourceId?: string;
  resourceType: string;
  metadata?: Record<string, unknown>;
}) {
  const audit = {
    id: `audit_${randomUUID()}`,
    actorId: input.context.actorId,
    ...auditInput(input),
  };
  memoryStore().auditEvents.push(audit);
  return audit;
}

async function createProviderAlertPrisma(input: {
  priority: ProviderAlertPriority;
  type: ProviderAlertType;
}) {
  const alert = buildProviderAlert(input);
  const deliveryStatus = await dispatchProviderAlert(alert);

  await ensureChristopherProviderPrisma();
  await prisma.providerAlert.create({
    data: {
      body: alert.body,
      deliveryStatus: toPrismaJson(deliveryStatus),
      id: alert.id,
      priority: alert.priority,
      providerId: CLINICAL_LEAD_PROVIDER_ID,
      route: alert.route,
      title: alert.title,
      type: alert.type,
    },
  });

  return { ...alert, deliveryStatus };
}

async function createProviderAlertMemory(input: {
  priority: ProviderAlertPriority;
  type: ProviderAlertType;
}) {
  const alert = buildProviderAlert(input);
  const deliveryStatus = await dispatchProviderAlert(alert);
  const storedAlert: StoredProviderAlert = {
    ...alert,
    deliveryStatus,
    providerId: CLINICAL_LEAD_PROVIDER_ID,
  };

  memoryStore().providerAlerts.unshift(storedAlert);
  return storedAlert;
}

function onboardingStatus(input: OnboardingInput, matches: MatchCandidate[]) {
  if (input.clientState !== "FL") {
    return "out-of-state";
  }

  return matches.length > 0 ? "admin-review" : "manual-review";
}

export async function submitOnboarding(input: OnboardingInput, context: RequestContext) {
  const launchProviders = getLaunchProviders();
  const matches = computeMatchCandidates(input, launchProviders).slice(0, 3);
  const status = onboardingStatus(input, matches);
  const consents = ["TERMS", "PRIVACY", "TELEHEALTH", ...(input.wantsAiSupport ? ["AI_COMPANION"] : [])];
  const notification = createSafeNotification({ purpose: "intake-received" });

  return runWithStore(
    async () => {
      await ensureChristopherProviderPrisma();

      const displayName = input.preferredName ?? "Cardigan client";
      const user = await prisma.user.upsert({
        where: { email: input.email.toLowerCase() },
        update: {
          displayName,
          role: "CLIENT",
        },
        create: {
          email: input.email.toLowerCase(),
          displayName,
          role: "CLIENT",
        },
      });

      const client = await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {
          ageRange: input.ageRange,
          concerns: input.concerns,
          legalName: input.legalName,
          matchedProviderId: matches[0]?.provider.id,
          modalityPreference: input.modalityPreference,
          phone: input.phone,
          preferredName: input.preferredName,
          state: input.clientState,
          timezone: "America/New_York",
        },
        create: {
          ageRange: input.ageRange,
          concerns: input.concerns,
          legalName: input.legalName,
          matchedProviderId: matches[0]?.provider.id,
          modalityPreference: input.modalityPreference,
          phone: input.phone,
          preferredName: input.preferredName,
          state: input.clientState,
          timezone: "America/New_York",
          userId: user.id,
        },
      });

      const intake = await prisma.intakeResponse.create({
        data: {
          answers: toPrismaJson(intakeAnswers(input)),
          clientId: client.id,
          consentedToMatch: input.consentedToMatch,
          reviewStatus: "submitted",
          triageSummary:
            status === "admin-review"
              ? "Florida intake ready for admin review."
              : "Manual eligibility review required.",
        },
      });

      await Promise.all(
        consents.map((type) =>
          prisma.consentArtifact.upsert({
            where: {
              clientId_type_version: {
                clientId: client.id,
                type: type as "TERMS" | "PRIVACY" | "TELEHEALTH" | "AI_COMPANION" | "PAYMENT",
                version: CONSENT_VERSION,
              },
            },
            update: {
              documentHash: consentHash(type),
              ipAddress: context.ipAddress,
              userAgent: undefined,
            },
            create: {
              clientId: client.id,
              documentHash: consentHash(type),
              ipAddress: context.ipAddress,
              type: type as "TERMS" | "PRIVACY" | "TELEHEALTH" | "AI_COMPANION" | "PAYMENT",
              version: CONSENT_VERSION,
            },
          }),
        ),
      );

      await Promise.all(
        matches.map((match) =>
          prisma.matchCandidate.upsert({
            where: {
              clientId_providerId: {
                clientId: client.id,
                providerId: match.provider.id,
              },
            },
            update: {
              reasons: match.reasons,
              score: match.score,
            },
            create: {
              clientId: client.id,
              providerId: match.provider.id,
              reasons: match.reasons,
              score: match.score,
            },
          }),
        ),
      );

      const requestedSession =
        input.requestedSessionStartsAt && matches[0]
          ? await prisma.session.create({
              data: {
                clientId: client.id,
                dailyRoomName: createSafeDailyRoomName(`requested-${intake.id}`),
                endsAt: new Date(sessionEndsAt(input.requestedSessionStartsAt)),
                providerId: matches[0].provider.id,
                startsAt: new Date(input.requestedSessionStartsAt),
                status: "REQUESTED",
              },
            })
          : null;

      if (requestedSession) {
        await createAuditPrisma({
          action: "session.requested",
          context,
          metadata: { source: "intake_calendar" },
          resourceId: requestedSession.id,
          resourceType: "Session",
        });
      }

      await createAuditPrisma({
        action: "intake.submitted",
        context,
        metadata: { matchCount: matches.length, notification: notification.purpose, status },
        resourceId: intake.id,
        resourceType: "IntakeResponse",
      });

      const alerts = [
        await createProviderAlertPrisma({ priority: "high", type: "intake-submitted" }),
      ];

      if (requestedSession) {
        alerts.push(await createProviderAlertPrisma({ priority: "high", type: "session-requested" }));
      }

      return {
        intakeId: intake.id,
        clientId: client.id,
        status,
        matches,
        consents,
        storageMode: "prisma" as const,
        alerts,
        notification,
        requestedSession,
        audit: auditInput({
          action: "intake.submitted",
          context,
          metadata: { matchCount: matches.length, status },
          resourceId: intake.id,
          resourceType: "IntakeResponse",
        }),
      };
    },
    async () => {
      const store = memoryStore();
      const existingClient = store.clients.find(
        (client) => client.email.toLowerCase() === input.email.toLowerCase(),
      );
      const clientId = existingClient?.id ?? `client_${randomUUID()}`;
      const userId = existingClient?.userId ?? `user_${randomUUID()}`;

      const client: StoredClient = {
        ageRange: input.ageRange,
        concerns: input.concerns,
        email: input.email.toLowerCase(),
        id: clientId,
        legalName: input.legalName,
        matchedProviderId: matches[0]?.provider.id,
        modalityPreference: input.modalityPreference,
        phone: input.phone,
        preferredName: input.preferredName,
        state: input.clientState,
        timezone: "America/New_York",
        userId,
      };

      if (existingClient) {
        Object.assign(existingClient, client);
      } else {
        store.clients.push(client);
      }

      const intakeId = `intake_${randomUUID()}`;
      store.intakes.push({
        id: intakeId,
        answers: intakeAnswers(input),
        clientId,
        consentedToMatch: input.consentedToMatch,
        createdAt: new Date().toISOString(),
        reviewStatus: "submitted",
        status,
      });

      for (const type of consents) {
        store.consents.push({
          id: `consent_${randomUUID()}`,
          clientId,
          documentHash: consentHash(type),
          signedAt: new Date().toISOString(),
          type,
          version: CONSENT_VERSION,
        });
      }

      for (const match of matches) {
        store.matchCandidates.push({
          id: `match_${randomUUID()}`,
          clientId,
          providerId: match.provider.id,
          reasons: match.reasons,
          score: match.score,
        });
      }

      const requestedSession =
        input.requestedSessionStartsAt && matches[0]
          ? {
              id: `session_${randomUUID()}`,
              clientId,
              providerId: matches[0].provider.id,
              startsAt: input.requestedSessionStartsAt,
              endsAt: sessionEndsAt(input.requestedSessionStartsAt),
              createdAt: new Date().toISOString(),
              dailyRoomName: "",
              status: "REQUESTED",
            }
          : null;

      if (requestedSession) {
        requestedSession.dailyRoomName = createSafeDailyRoomName(requestedSession.id);
        store.sessions.push(requestedSession);
        createAuditMemory({
          action: "session.requested",
          context,
          metadata: { source: "intake_calendar" },
          resourceId: requestedSession.id,
          resourceType: "Session",
        });
      }

      const audit = createAuditMemory({
        action: "intake.submitted",
        context,
        metadata: { matchCount: matches.length, notification: notification.purpose, status },
        resourceId: intakeId,
        resourceType: "IntakeResponse",
      });

      const alerts = [
        await createProviderAlertMemory({ priority: "high", type: "intake-submitted" }),
      ];

      if (requestedSession) {
        alerts.push(await createProviderAlertMemory({ priority: "high", type: "session-requested" }));
      }

      return {
        intakeId,
        clientId,
        status,
        matches,
        consents,
        storageMode: "memory" as const,
        alerts,
        notification,
        requestedSession,
        audit,
      };
    },
  );
}

export async function signConsent(input: ConsentInput, context: RequestContext) {
  return runWithStore(
    async () => {
      const consent = await prisma.consentArtifact.upsert({
        where: {
          clientId_type_version: {
            clientId: input.clientId,
            type: input.type,
            version: input.version,
          },
        },
        update: {
          documentHash: input.documentHash,
          ipAddress: context.ipAddress,
        },
        create: {
          clientId: input.clientId,
          documentHash: input.documentHash,
          ipAddress: context.ipAddress,
          type: input.type,
          version: input.version,
        },
      });

      await createAuditPrisma({
        action: "consent.signed",
        context,
        resourceId: consent.id,
        resourceType: "ConsentArtifact",
      });

      return { ...consent, storageMode: "prisma" as const };
    },
    async () => {
      const consent = {
        id: `consent_${randomUUID()}`,
        ...input,
        signedAt: new Date().toISOString(),
      };
      memoryStore().consents.push(consent);
      createAuditMemory({
        action: "consent.signed",
        context,
        resourceId: consent.id,
        resourceType: "ConsentArtifact",
      });
      return { ...consent, storageMode: "memory" as const };
    },
  );
}

export async function createMessage(input: MessageInput, context: RequestContext) {
  const riskLevel = classifyRisk(input.body);
  const escalated = riskLevel === "high" || riskLevel === "crisis";

  return runWithStore(
    async () => {
      const message = await prisma.message.create({
        data: {
          body: input.body,
          riskLevel: riskLevel.toUpperCase() as "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRISIS",
          senderId: input.senderId,
          threadId: input.threadId,
        },
      });

      if (escalated) {
        const thread = await prisma.messageThread.findUnique({
          where: { id: input.threadId },
          select: { clientId: true },
        });

        if (thread) {
          await prisma.crisisFlag.create({
            data: {
              clientId: thread.clientId,
              severity: riskLevel.toUpperCase() as "HIGH" | "CRISIS",
              source: "message",
              summary: "Message requires immediate clinical/admin review.",
            },
          });
        }
      }

      await createAuditPrisma({
        action: escalated ? "message.escalated" : "message.created",
        context,
        metadata: { riskLevel },
        resourceId: message.id,
        resourceType: "Message",
      });

      const alert = await createProviderAlertPrisma({
        priority: escalated ? "urgent" : "high",
        type: escalated ? "message-escalated" : "message-created",
      });

      return {
        alert,
        messageId: message.id,
        threadId: input.threadId,
        status: escalated ? "escalated-for-review" : "sent",
        riskLevel,
        storageMode: "prisma" as const,
      };
    },
    async () => {
      const store = memoryStore();
      const messageId = `message_${randomUUID()}`;
      let thread = store.threads.find((item) => item.id === input.threadId);

      if (!thread) {
        thread = {
          clientId: "client_pending",
          id: input.threadId,
          providerId: CLINICAL_LEAD_PROVIDER_ID,
          status: escalated ? "ESCALATED" : "OPEN",
        };
        store.threads.push(thread);
      }

      if (escalated) {
        thread.status = "ESCALATED";
        store.crisisFlags.push({
          id: `crisis_${randomUUID()}`,
          clientId: thread.clientId,
          createdAt: new Date().toISOString(),
          severity: riskLevel,
          source: "message",
          status: "OPEN",
          summary: "Message requires immediate clinical/admin review.",
        });
      }

      store.messages.push({
        id: messageId,
        body: input.body,
        createdAt: new Date().toISOString(),
        riskLevel,
        senderId: input.senderId,
        threadId: input.threadId,
      });
      createAuditMemory({
        action: escalated ? "message.escalated" : "message.created",
        context,
        metadata: { riskLevel },
        resourceId: messageId,
        resourceType: "Message",
      });

      const alert = await createProviderAlertMemory({
        priority: escalated ? "urgent" : "high",
        type: escalated ? "message-escalated" : "message-created",
      });

      return {
        alert,
        messageId,
        threadId: input.threadId,
        status: escalated ? "escalated-for-review" : "sent",
        riskLevel,
        storageMode: "memory" as const,
      };
    },
  );
}

export async function createAssessment(input: AssessmentInput, context: RequestContext) {
  return runWithStore(
    async () => {
      const assessment = await prisma.assessment.create({
        data: {
          clientId: input.clientId,
          payload: toPrismaJson(input.payload),
          score: input.score,
          type: input.type,
        },
      });
      await createAuditPrisma({
        action: "assessment.created",
        context,
        resourceId: assessment.id,
        resourceType: "Assessment",
      });
      const alert = await createProviderAlertPrisma({ priority: "normal", type: "assessment-created" });
      return { ...assessment, alert, storageMode: "prisma" as const };
    },
    async () => {
      const assessment = {
        id: `assessment_${randomUUID()}`,
        ...input,
        createdAt: new Date().toISOString(),
      };
      memoryStore().assessments.push(assessment);
      createAuditMemory({
        action: "assessment.created",
        context,
        resourceId: assessment.id,
        resourceType: "Assessment",
      });
      const alert = await createProviderAlertMemory({ priority: "normal", type: "assessment-created" });
      return { ...assessment, alert, storageMode: "memory" as const };
    },
  );
}

export async function createNote(input: NoteInput, context: RequestContext) {
  return runWithStore(
    async () => {
      const note = await prisma.therapistNote.create({
        data: {
          body: input.body,
          clientId: input.clientId,
          providerId: input.providerId,
          sessionId: input.sessionId,
          title: input.title,
        },
      });
      await createAuditPrisma({
        action: "note.created",
        context,
        resourceId: note.id,
        resourceType: "TherapistNote",
      });
      return { ...note, lockedAt: null, storageMode: "prisma" as const };
    },
    async () => {
      const note = {
        id: `note_${randomUUID()}`,
        ...input,
        createdAt: new Date().toISOString(),
        lockedAt: null,
      };
      memoryStore().notes.push(note);
      createAuditMemory({
        action: "note.created",
        context,
        resourceId: note.id,
        resourceType: "TherapistNote",
      });
      return { ...note, storageMode: "memory" as const };
    },
  );
}

export async function requestProviderSwitch(input: ProviderSwitchInput, context: RequestContext) {
  return runWithStore(
    async () => {
      const audit = await createAuditPrisma({
        action: "provider_switch.requested",
        context,
        metadata: {
          currentProviderId: input.currentProviderId,
          reasonCode: input.reasonCode,
        },
        resourceId: input.clientId,
        resourceType: "ProviderSwitchRequest",
      });
      const alert = await createProviderAlertPrisma({
        priority: "high",
        type: "provider-switch-requested",
      });
      return {
        alert,
        switchRequestId: audit.id,
        status: "admin-review",
        storageMode: "prisma" as const,
      };
    },
    async () => {
      const request = {
        id: `switch_${randomUUID()}`,
        ...input,
        createdAt: new Date().toISOString(),
        status: "admin-review",
      };
      memoryStore().providerSwitches.push(request);
      createAuditMemory({
        action: "provider_switch.requested",
        context,
        metadata: {
          currentProviderId: input.currentProviderId,
          reasonCode: input.reasonCode,
        },
        resourceId: request.id,
        resourceType: "ProviderSwitchRequest",
      });
      const alert = await createProviderAlertMemory({
        priority: "high",
        type: "provider-switch-requested",
      });
      return {
        alert,
        switchRequestId: request.id,
        status: request.status,
        storageMode: "memory" as const,
      };
    },
  );
}

export async function createSessionRequest(input: SessionInput, context: RequestContext, dailyRoomName: string) {
  return runWithStore(
    async () => {
      const session = await prisma.session.create({
        data: {
          clientId: input.clientId,
          dailyRoomName,
          endsAt: new Date(input.endsAt),
          providerId: input.providerId,
          startsAt: new Date(input.startsAt),
          status: "REQUESTED",
        },
      });
      await createAuditPrisma({
        action: "session.requested",
        context,
        resourceId: session.id,
        resourceType: "Session",
      });
      const alert = await createProviderAlertPrisma({ priority: "high", type: "session-requested" });
      return { ...session, alert, storageMode: "prisma" as const };
    },
    async () => {
      const session = {
        id: input.sessionId,
        ...input,
        createdAt: new Date().toISOString(),
        dailyRoomName,
        status: "REQUESTED",
      };
      memoryStore().sessions.push(session);
      createAuditMemory({
        action: "session.requested",
        context,
        resourceId: session.id,
        resourceType: "Session",
      });
      const alert = await createProviderAlertMemory({ priority: "high", type: "session-requested" });
      return { ...session, alert, storageMode: "memory" as const };
    },
  );
}

export async function recordAiConversation(
  input: AiChatInput,
  context: RequestContext,
  safety: { riskLevel: RiskLevel; escalationRequired: boolean; allowed: boolean },
  reply: string,
) {
  const savedToRecord = input.consentedToSave && safety.allowed;

  return runWithStore(
    async () => {
      const conversation = savedToRecord
        ? await prisma.aIConversation.create({
            data: {
              clientId: input.clientId,
              consentedToSave: input.consentedToSave,
              mode: input.mode
                .replaceAll("-", "_")
                .toUpperCase() as "INTAKE_GUIDE" | "SKILLS_COACH" | "BETWEEN_SESSION_SUPPORT",
              riskLevel: safety.riskLevel.toUpperCase() as "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRISIS",
              savedToRecord,
              transcript: toPrismaJson([{ role: "assistant", content: reply }]),
            },
          })
        : undefined;

      if (safety.escalationRequired) {
        await prisma.crisisFlag.create({
          data: {
            clientId: input.clientId,
            severity: safety.riskLevel.toUpperCase() as "HIGH" | "CRISIS",
            source: "ai",
            summary: "AI safety guardrail routed this conversation for review.",
          },
        });
      }

      await createAuditPrisma({
        action: safety.escalationRequired ? "ai.escalated" : "ai.responded",
        context,
        metadata: { riskLevel: safety.riskLevel, savedToRecord },
        resourceId: conversation?.id,
        resourceType: "AIConversation",
      });

      const alert = safety.escalationRequired
        ? await createProviderAlertPrisma({ priority: "urgent", type: "ai-escalated" })
        : undefined;

      return {
        alert,
        conversationId: conversation?.id ?? `ai_unsaved_${randomUUID()}`,
        savedToRecord,
        storageMode: "prisma" as const,
      };
    },
    async () => {
      const conversationId = `ai_${randomUUID()}`;

      if (savedToRecord) {
        memoryStore().aiConversations.push({
          id: conversationId,
          clientId: input.clientId,
          mode: input.mode,
          riskLevel: safety.riskLevel,
          savedToRecord,
        });
      }

      if (safety.escalationRequired) {
        memoryStore().crisisFlags.push({
          id: `crisis_${randomUUID()}`,
          clientId: input.clientId,
          createdAt: new Date().toISOString(),
          severity: safety.riskLevel,
          source: "ai",
          status: "OPEN",
          summary: "AI safety guardrail routed this conversation for review.",
        });
      }

      createAuditMemory({
        action: safety.escalationRequired ? "ai.escalated" : "ai.responded",
        context,
        metadata: { riskLevel: safety.riskLevel, savedToRecord },
        resourceId: conversationId,
        resourceType: "AIConversation",
      });

      const alert = safety.escalationRequired
        ? await createProviderAlertMemory({ priority: "urgent", type: "ai-escalated" })
        : undefined;

      return { alert, conversationId, savedToRecord, storageMode: "memory" as const };
    },
  );
}

export async function exportAuditEvents() {
  return runWithStore(
    async () => {
      const events = await prisma.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 250,
      });
      return {
        events,
        generatedAt: new Date().toISOString(),
        storageMode: "prisma" as const,
      };
    },
    async () => ({
      events: [...memoryStore().auditEvents].reverse(),
      generatedAt: new Date().toISOString(),
      storageMode: "memory" as const,
    }),
  );
}

export async function getProviderPracticeSnapshot() {
  return runWithStore(
    async () => {
      await ensureChristopherProviderPrisma();

      const [provider, intakes, clients, sessions, notes, crisisFlags, providerAlerts] = await Promise.all([
        prisma.providerProfile.findUnique({
          where: { id: CLINICAL_LEAD_PROVIDER_ID },
          select: {
            acceptingClients: true,
            credentials: true,
            id: true,
            specialties: true,
            user: { select: { displayName: true, email: true } },
          },
        }),
        prisma.intakeResponse.findMany({
          include: {
            client: {
              select: {
                ageRange: true,
                concerns: true,
                id: true,
                legalName: true,
                modalityPreference: true,
                phone: true,
                preferredName: true,
                state: true,
                user: { select: { email: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.clientProfile.findMany({
          where: { matchedProviderId: CLINICAL_LEAD_PROVIDER_ID },
          orderBy: { updatedAt: "desc" },
          select: {
            ageRange: true,
            concerns: true,
            id: true,
            legalName: true,
            phone: true,
            preferredName: true,
            state: true,
            user: { select: { email: true } },
          },
        }),
        prisma.session.findMany({
          where: { providerId: CLINICAL_LEAD_PROVIDER_ID },
          include: {
            client: {
              select: {
                id: true,
                legalName: true,
                phone: true,
                preferredName: true,
                state: true,
                user: { select: { email: true } },
              },
            },
          },
          orderBy: { startsAt: "asc" },
          take: 25,
        }),
        prisma.therapistNote.findMany({
          where: { providerId: CLINICAL_LEAD_PROVIDER_ID },
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
        prisma.crisisFlag.findMany({
          where: { status: "OPEN" },
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
        prisma.providerAlert.findMany({
          where: { providerId: CLINICAL_LEAD_PROVIDER_ID },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ]);

      return {
        provider,
        intakes,
        clients,
        sessions,
        notes,
        openRiskFlags: crisisFlags,
        providerAlerts,
        alertConfig: alertConfigStatus(),
        storageMode: "prisma" as const,
      };
    },
    async () => {
      const store = memoryStore();
      const provider = getLaunchProviders()[0];
      const clients = store.clients.filter((client) => client.matchedProviderId === CLINICAL_LEAD_PROVIDER_ID);

      return {
        provider: {
          acceptingClients: provider.acceptingClients,
          credentials: provider.credentials,
          id: provider.id,
          specialties: provider.specialties,
          user: { displayName: provider.displayName, email: CLINICAL_LEAD_EMAIL },
        },
        intakes: [...store.intakes].reverse().map((intake) => {
          const client = store.clients.find((item) => item.id === intake.clientId);
          return {
            ...intake,
            client: client
              ? {
                  ageRange: client.ageRange,
                  concerns: client.concerns,
                  id: client.id,
                  legalName: client.legalName,
                  modalityPreference: client.modalityPreference,
                  phone: client.phone,
                  preferredName: client.preferredName,
                  state: client.state,
                  user: { email: client.email },
                }
              : undefined,
          };
        }),
        clients,
        sessions: store.sessions
          .filter((session) => session.providerId === CLINICAL_LEAD_PROVIDER_ID)
          .map((session) => {
            const clientId = typeof session.clientId === "string" ? session.clientId : undefined;
            const client = store.clients.find((item) => item.id === clientId);

            return {
              ...session,
              client: client
                ? {
                    id: client.id,
                    legalName: client.legalName,
                    phone: client.phone,
                    preferredName: client.preferredName,
                    state: client.state,
                    user: { email: client.email },
                  }
                : undefined,
            };
          }),
        notes: store.notes.filter((note) => note.providerId === CLINICAL_LEAD_PROVIDER_ID),
        openRiskFlags: store.crisisFlags.filter((flag) => flag.status === "OPEN"),
        providerAlerts: store.providerAlerts.filter((alert) => alert.providerId === CLINICAL_LEAD_PROVIDER_ID),
        alertConfig: alertConfigStatus(),
        storageMode: "memory" as const,
      };
    },
  );
}

export async function updateIntakeReviewStatus(
  input: { intakeId: string; reviewNote?: string; status: IntakeReviewStatus },
  context: RequestContext,
) {
  return runWithStore(
    async () => {
      const intake = await prisma.intakeResponse.update({
        where: { id: input.intakeId },
        data: {
          reviewNote: input.reviewNote,
          reviewStatus: input.status,
          reviewedAt: new Date(),
        },
      });

      await createAuditPrisma({
        action: "intake.review_status_updated",
        context,
        metadata: { status: input.status },
        resourceId: intake.id,
        resourceType: "IntakeResponse",
      });

      return { intakeId: intake.id, reviewStatus: intake.reviewStatus, storageMode: "prisma" as const };
    },
    async () => {
      const intake = memoryStore().intakes.find((item) => item.id === input.intakeId);

      if (!intake) {
        throw new Error("Intake not found.");
      }

      intake.reviewStatus = input.status;
      intake.reviewNote = input.reviewNote;
      intake.reviewedAt = new Date().toISOString();
      createAuditMemory({
        action: "intake.review_status_updated",
        context,
        metadata: { status: input.status },
        resourceId: intake.id,
        resourceType: "IntakeResponse",
      });

      return { intakeId: intake.id, reviewStatus: intake.reviewStatus, storageMode: "memory" as const };
    },
  );
}

export async function markProviderAlertRead(input: { alertId: string }, context: RequestContext) {
  return runWithStore(
    async () => {
      const alert = await prisma.providerAlert.update({
        where: { id: input.alertId },
        data: { readAt: new Date() },
      });

      await createAuditPrisma({
        action: "provider_alert.read",
        context,
        resourceId: alert.id,
        resourceType: "ProviderAlert",
      });

      return { alertId: alert.id, readAt: alert.readAt, storageMode: "prisma" as const };
    },
    async () => {
      const alert = memoryStore().providerAlerts.find((item) => item.id === input.alertId);

      if (!alert) {
        throw new Error("Provider alert not found.");
      }

      alert.readAt = new Date().toISOString();
      createAuditMemory({
        action: "provider_alert.read",
        context,
        resourceId: alert.id,
        resourceType: "ProviderAlert",
      });

      return { alertId: alert.id, readAt: alert.readAt, storageMode: "memory" as const };
    },
  );
}

export async function getAdminIntakeSnapshot() {
  return runWithStore(
    async () => {
      const intakes = await prisma.intakeResponse.findMany({
        include: {
          client: {
            select: {
              ageRange: true,
              concerns: true,
              id: true,
              matchedProviderId: true,
              modalityPreference: true,
              state: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return { intakes, storageMode: "prisma" as const };
    },
    async () => ({
      intakes: memoryStore().intakes.map((intake) => {
        const client = memoryStore().clients.find((item) => item.id === intake.clientId);
        return {
          ...intake,
          client: client
            ? {
                ageRange: client.ageRange,
                concerns: client.concerns,
                id: client.id,
                matchedProviderId: client.matchedProviderId,
                modalityPreference: client.modalityPreference,
                state: client.state,
              }
            : undefined,
        };
      }),
      storageMode: "memory" as const,
    }),
  );
}

export async function getClientDashboardSnapshot(clientId?: string) {
  return runWithStore(
    async () => {
      if (!clientId) {
        return {
          client: null,
          consents: [],
          membershipStatus: "not-started",
          messagesOpen: false,
          storageMode: "prisma" as const,
        };
      }

      const client = await prisma.clientProfile.findUnique({
        where: { id: clientId },
        select: {
          ageRange: true,
          consentArtifacts: {
            select: { signedAt: true, type: true, version: true },
          },
          id: true,
          matchedProvider: {
            select: {
              credentials: true,
              id: true,
              user: { select: { displayName: true } },
            },
          },
          state: true,
        },
      });

      return {
        client,
        consents: client?.consentArtifacts ?? [],
        membershipStatus: "not-started",
        messagesOpen: Boolean(client?.matchedProvider),
        storageMode: "prisma" as const,
      };
    },
    async () => {
      const store = memoryStore();
      const client = clientId ? store.clients.find((item) => item.id === clientId) : undefined;
      return {
        client: client
          ? {
              ageRange: client.ageRange,
              id: client.id,
              matchedProviderId: client.matchedProviderId,
              state: client.state,
            }
          : null,
        consents: clientId ? store.consents.filter((consent) => consent.clientId === clientId) : [],
        membershipStatus: "not-started",
        messagesOpen: Boolean(client?.matchedProviderId),
        storageMode: "memory" as const,
      };
    },
  );
}

export async function getProviderDashboardSnapshot() {
  return runWithStore(
    async () => {
      const provider = await prisma.providerProfile.findUnique({
        where: { id: CLINICAL_LEAD_PROVIDER_ID },
        select: {
          acceptingClients: true,
          credentials: true,
          id: true,
          matchedClients: {
            select: {
              ageRange: true,
              id: true,
              state: true,
            },
          },
          user: { select: { displayName: true } },
        },
      });
      const crisisFlags = await prisma.crisisFlag.count({ where: { status: "OPEN" } });

      return {
        provider,
        assignedClientCount: provider?.matchedClients.length ?? 0,
        openRiskFlags: crisisFlags,
        storageMode: "prisma" as const,
      };
    },
    async () => {
      const store = memoryStore();
      const assignedClients = store.clients.filter(
        (client) => client.matchedProviderId === CLINICAL_LEAD_PROVIDER_ID,
      );
      const provider = getLaunchProviders()[0];

      return {
        provider: {
          acceptingClients: provider.acceptingClients,
          credentials: provider.credentials,
          id: provider.id,
          user: { displayName: provider.displayName },
        },
        assignedClientCount: assignedClients.length,
        openRiskFlags: store.crisisFlags.filter((flag) => flag.status === "OPEN").length,
        storageMode: "memory" as const,
      };
    },
  );
}
