import { randomUUID } from "node:crypto";
import { getProviderPracticeSnapshot } from "./clinical-store";
import { assertNoPhiMetadata, redactForLogs } from "./compliance";

type DatabaseKey =
  | "finance"
  | "launchTasks"
  | "marketing"
  | "projects"
  | "providerOps"
  | "sops"
  | "syncLog";

type SyncMode = "local-memory" | "notion-api";
type SyncDirection = "push" | "pull" | "bootstrap";

export type NotionOsRecord = {
  databaseKey: Exclude<DatabaseKey, "syncLog">;
  localId: string;
  lastEditedAt: string;
  priority: "Low" | "Medium" | "High";
  status: "Backlog" | "Next" | "In Progress" | "Done" | "Blocked";
  summary: string;
  title: string;
};

export type SyncMapping = {
  databaseKey: DatabaseKey;
  lastPulledAt?: string;
  lastPushedAt?: string;
  lastSyncedAt: string;
  localId: string;
  localLastEditedAt?: string;
  notionPageId: string;
  remoteLastEditedAt?: string;
};

type SyncLog = {
  action: string;
  createdAt: string;
  detail: string;
  direction: SyncDirection;
  id: string;
  status: "success" | "warning" | "error";
};

type NotionMemoryState = {
  databaseIds: Partial<Record<DatabaseKey, string>>;
  logs: SyncLog[];
  mappings: SyncMapping[];
  osPageId?: string;
  records: NotionOsRecord[];
};

const databaseEnv: Record<DatabaseKey, string> = {
  finance: "NOTION_FINANCE_DATABASE_ID",
  launchTasks: "NOTION_TASKS_DATABASE_ID",
  marketing: "NOTION_MARKETING_DATABASE_ID",
  projects: "NOTION_PROJECTS_DATABASE_ID",
  providerOps: "NOTION_PROVIDER_OPS_DATABASE_ID",
  sops: "NOTION_SOPS_DATABASE_ID",
  syncLog: "NOTION_SYNC_LOG_DATABASE_ID",
};

const databaseTitles: Record<DatabaseKey, string> = {
  finance: "Finance & Revenue",
  launchTasks: "Launch Tasks",
  marketing: "Marketing Calendar",
  projects: "Projects",
  providerOps: "Provider Operations",
  sops: "SOPs",
  syncLog: "Sync Log",
};

const blockedPayloadKeys = [
  "ageRange",
  "aiConversation",
  "assessment",
  "body",
  "client",
  "clientId",
  "clientName",
  "concerns",
  "dateOfBirth",
  "diagnosis",
  "email",
  "intake",
  "legalName",
  "message",
  "modalityPreference",
  "note",
  "phone",
  "preferredName",
  "symptom",
  "therapy",
  "therapistNote",
  "transcript",
];

const blockedPayloadTerms = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b(anxiety|adhd|depression|diagnosis|panic|symptom|therapy note|trauma)\b/i,
];

const globalStore = globalThis as typeof globalThis & {
  cardiganNotionOs?: NotionMemoryState;
};

function memoryStore(): NotionMemoryState {
  globalStore.cardiganNotionOs ??= {
    databaseIds: {},
    logs: [],
    mappings: [],
    records: [],
  };

  return globalStore.cardiganNotionOs;
}

function nowIso() {
  return new Date().toISOString();
}

function databaseId(key: DatabaseKey) {
  const storedId = memoryStore().databaseIds[key];

  if (liveToken()) {
    return process.env[databaseEnv[key]] ?? (storedId?.startsWith("local_db_") ? undefined : storedId);
  }

  return process.env[databaseEnv[key]] ?? storedId;
}

function liveToken() {
  return process.env.NOTION_TOKEN;
}

function osPageId() {
  const storedId = memoryStore().osPageId;

  if (liveToken()) {
    return process.env.NOTION_CARDIGAN_OS_PAGE_ID ?? (storedId?.startsWith("local_page_") ? undefined : storedId);
  }

  return process.env.NOTION_CARDIGAN_OS_PAGE_ID ?? storedId;
}

function syncMode(): SyncMode {
  return liveToken() ? "notion-api" : "local-memory";
}

function addLog(input: Omit<SyncLog, "createdAt" | "id">) {
  const log = {
    id: `notion_log_${randomUUID()}`,
    createdAt: nowIso(),
    ...input,
  };
  memoryStore().logs.unshift(log);
  return log;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function assertNotionPayloadSafe(value: unknown) {
  const text = JSON.stringify(value);

  for (const key of blockedPayloadKeys) {
    if (new RegExp(`"${key}"\\s*:`, "i").test(text)) {
      throw new Error(`Notion sync payload cannot include PHI field: ${key}`);
    }
  }

  for (const pattern of blockedPayloadTerms) {
    if (pattern.test(text)) {
      throw new Error("Notion sync payload cannot include PHI, clinical language, or direct identifiers.");
    }
  }

  if (value && typeof value === "object") {
    assertNoPhiMetadata(value as Record<string, unknown>);
  }
}

export function buildCompanyOsRecords(input: {
  consultRequestCount: number;
  lastEditedAt?: string;
  openRiskFlagCount: number;
  providerWorkspaceStatus: "Blocked" | "Done" | "In Progress";
}): NotionOsRecord[] {
  const lastEditedAt = input.lastEditedAt ?? nowIso();
  const records: NotionOsRecord[] = [
    {
      databaseKey: "launchTasks",
      lastEditedAt,
      localId: "launch-task-provider-login",
      priority: "High",
      status: "Done",
      summary: "Provider login and local fullstack request review are active.",
      title: "Provider login and local request queue",
    },
    {
      databaseKey: "launchTasks",
      lastEditedAt,
      localId: "launch-task-notion-company-os",
      priority: "Medium",
      status: "In Progress",
      summary: "Company OS sync is limited to operations and excludes clinical records.",
      title: "Notion Company OS sync",
    },
    {
      databaseKey: "projects",
      lastEditedAt,
      localId: "project-cardigan-local-fullstack",
      priority: "High",
      status: input.providerWorkspaceStatus,
      summary: "Local fullstack MVP supports public request intake and provider review.",
      title: "Cardigan local fullstack MVP",
    },
    {
      databaseKey: "sops",
      lastEditedAt,
      localId: "sop-notion-no-phi",
      priority: "High",
      status: "Done",
      summary: "Notion receives operating records only. Clinical and identifying details stay in Cardigan.",
      title: "No PHI in Notion sync",
    },
    {
      databaseKey: "marketing",
      lastEditedAt,
      localId: "marketing-florida-pilot",
      priority: "Medium",
      status: "Next",
      summary: "Prepare Florida pilot public-page campaign after intake and payment review.",
      title: "Florida pilot launch campaign",
    },
    {
      databaseKey: "finance",
      lastEditedAt,
      localId: "finance-starter-deposit",
      priority: "Medium",
      status: "Next",
      summary: "Track generic starter-deposit readiness and payment operations review.",
      title: "Starter deposit operations review",
    },
    {
      databaseKey: "providerOps",
      lastEditedAt,
      localId: "provider-ops-consult-count",
      priority: input.consultRequestCount > 0 ? "High" : "Medium",
      status: input.consultRequestCount > 0 ? "In Progress" : "Next",
      summary: `${input.consultRequestCount} generic consult request(s) awaiting operations review.`,
      title: "Consult request count",
    },
    {
      databaseKey: "providerOps",
      lastEditedAt,
      localId: "provider-ops-risk-count",
      priority: input.openRiskFlagCount > 0 ? "High" : "Low",
      status: input.openRiskFlagCount > 0 ? "Blocked" : "Done",
      summary: `${input.openRiskFlagCount} generic review flag(s) currently open.`,
      title: "Operations review flag count",
    },
  ];

  for (const record of records) {
    assertNotionPayloadSafe(record);
  }

  return records;
}

export async function buildCompanyOsRecordsFromPractice() {
  const snapshot = await getProviderPracticeSnapshot();

  return buildCompanyOsRecords({
    consultRequestCount: snapshot.intakes.length,
    openRiskFlagCount: snapshot.openRiskFlags.length,
    providerWorkspaceStatus: "In Progress",
  });
}

export function resolveSyncConflict(input: {
  localLastEditedAt: string;
  remoteLastEditedAt: string;
  lastSyncedAt: string;
}) {
  const localChanged = Date.parse(input.localLastEditedAt) > Date.parse(input.lastSyncedAt);
  const remoteChanged = Date.parse(input.remoteLastEditedAt) > Date.parse(input.lastSyncedAt);

  if (localChanged && remoteChanged) {
    return Date.parse(input.remoteLastEditedAt) > Date.parse(input.localLastEditedAt)
      ? "remote"
      : "local";
  }

  if (remoteChanged) {
    return "remote";
  }

  return "local";
}

export function resetNotionOsForTests() {
  globalStore.cardiganNotionOs = undefined;
}

function upsertMapping(input: {
  databaseKey: DatabaseKey;
  localId: string;
  localLastEditedAt?: string;
  notionPageId?: string;
  remoteLastEditedAt?: string;
}) {
  const store = memoryStore();
  let mapping = store.mappings.find(
    (item) => item.databaseKey === input.databaseKey && item.localId === input.localId,
  );

  if (!mapping) {
    mapping = {
      databaseKey: input.databaseKey,
      lastSyncedAt: nowIso(),
      localId: input.localId,
      notionPageId: input.notionPageId ?? `local_notion_${randomUUID()}`,
    };
    store.mappings.push(mapping);
  }

  mapping.localLastEditedAt = input.localLastEditedAt ?? mapping.localLastEditedAt;
  mapping.notionPageId = input.notionPageId ?? mapping.notionPageId;
  mapping.remoteLastEditedAt = input.remoteLastEditedAt ?? mapping.remoteLastEditedAt;
  mapping.lastSyncedAt = nowIso();

  return mapping;
}

export function notionStatus() {
  const configuredDatabases = Object.fromEntries(
    Object.keys(databaseEnv).map((key) => [key, Boolean(databaseId(key as DatabaseKey))]),
  ) as Record<DatabaseKey, boolean>;
  const store = memoryStore();
  const liveReady = Boolean(osPageId()) && Object.values(configuredDatabases).every(Boolean);

  return {
    configuredDatabases,
    hipaa: {
      baaRequiredForPhi: true,
      phiSyncEnabled: false,
      scope: "Company OS only",
    },
    lastSyncAt: store.logs[0]?.createdAt ?? null,
    logs: store.logs.slice(0, 8),
    mappings: store.mappings.length,
    mode: syncMode(),
    osPageId: osPageId() ?? null,
    ready: syncMode() === "local-memory" || liveReady,
  };
}

export async function bootstrapNotionOs() {
  const store = memoryStore();

  if (syncMode() === "notion-api") {
    const parentPageId = osPageId();

    if (!parentPageId) {
      addLog({
        action: "notion.bootstrap",
        detail: "Live Notion mode is missing NOTION_CARDIGAN_OS_PAGE_ID.",
        direction: "bootstrap",
        status: "warning",
      });

      return notionStatus();
    }

    const createdDatabases = [];

    for (const key of Object.keys(databaseTitles) as DatabaseKey[]) {
      if (databaseId(key)) {
        continue;
      }

      const database = await createNotionDatabase(key, parentPageId);
      store.databaseIds[key] = database.id;
      createdDatabases.push(databaseTitles[key]);
    }

    addLog({
      action: "notion.bootstrap",
      detail: createdDatabases.length
        ? `Created Notion database metadata: ${createdDatabases.join(", ")}.`
        : "Live Notion Company OS configuration is ready.",
      direction: "bootstrap",
      status: "success",
    });

    return notionStatus();
  }

  store.osPageId ??= osPageId() ?? `local_page_${randomUUID()}`;

  for (const key of Object.keys(databaseTitles) as DatabaseKey[]) {
    store.databaseIds[key] ??= databaseId(key) ?? `local_db_${key}_${randomUUID()}`;
  }

  addLog({
    action: "notion.bootstrap",
    detail: "Cardigan Company OS configuration initialized for operational sync.",
    direction: "bootstrap",
    status: "success",
  });

  return notionStatus();
}

function pageProperties(record: NotionOsRecord) {
  return {
    "Last Edited": { date: { start: record.lastEditedAt } },
    "Local ID": { rich_text: [{ text: { content: record.localId } }] },
    Name: { title: [{ text: { content: record.title } }] },
    Priority: { select: { name: record.priority } },
    Source: { select: { name: "Cardigan" } },
    Status: { select: { name: record.status } },
    Summary: { rich_text: [{ text: { content: record.summary } }] },
  };
}

async function notionFetch<T>(path: string, init: RequestInit): Promise<T> {
  const token = liveToken();

  if (!token) {
    throw new Error("NOTION_TOKEN is not configured.");
  }

  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "Notion-Version": "2022-06-28",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Notion API request failed: ${JSON.stringify(redactForLogs(data))}`);
  }

  return data as T;
}

function databaseProperties() {
  return {
    "Last Edited": { date: {} },
    "Local ID": { rich_text: {} },
    Name: { title: {} },
    Priority: {
      select: {
        options: [
          { color: "gray", name: "Low" },
          { color: "yellow", name: "Medium" },
          { color: "red", name: "High" },
        ],
      },
    },
    Source: {
      select: {
        options: [
          { color: "green", name: "Cardigan" },
          { color: "blue", name: "Notion" },
        ],
      },
    },
    Status: {
      select: {
        options: [
          { color: "gray", name: "Backlog" },
          { color: "blue", name: "Next" },
          { color: "yellow", name: "In Progress" },
          { color: "green", name: "Done" },
          { color: "red", name: "Blocked" },
        ],
      },
    },
    Summary: { rich_text: {} },
  };
}

async function createNotionDatabase(key: DatabaseKey, parentPageId: string) {
  return notionFetch<{ id: string }>("/databases", {
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: databaseProperties(),
      title: [{ text: { content: databaseTitles[key] } }],
    }),
    method: "POST",
  });
}

async function pushRecordToNotion(record: NotionOsRecord, existingPageId?: string) {
  const dbId = databaseId(record.databaseKey);

  if (!dbId) {
    throw new Error(`Missing ${databaseEnv[record.databaseKey]} for ${databaseTitles[record.databaseKey]}.`);
  }

  assertNotionPayloadSafe(record);

  if (syncMode() === "local-memory") {
    return {
      id: existingPageId ?? `local_notion_${randomUUID()}`,
      last_edited_time: nowIso(),
    };
  }

  if (existingPageId) {
    return notionFetch<{ id: string; last_edited_time: string }>(`/pages/${existingPageId}`, {
      body: JSON.stringify({ properties: pageProperties(record) }),
      method: "PATCH",
    });
  }

  return notionFetch<{ id: string; last_edited_time: string }>("/pages", {
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: pageProperties(record),
    }),
    method: "POST",
  });
}

export async function pushNotionOs() {
  await bootstrapNotionOs();

  const store = memoryStore();
  const records = await buildCompanyOsRecordsFromPractice();
  const synced = [];

  for (const record of records) {
    const existing = store.mappings.find(
      (item) => item.databaseKey === record.databaseKey && item.localId === record.localId,
    );
    const page = await pushRecordToNotion(record, existing?.notionPageId);
    const mapping = upsertMapping({
      databaseKey: record.databaseKey,
      localId: record.localId,
      localLastEditedAt: record.lastEditedAt,
      notionPageId: page.id,
      remoteLastEditedAt: page.last_edited_time,
    });

    store.records = store.records.filter(
      (item) => !(item.databaseKey === record.databaseKey && item.localId === record.localId),
    );
    store.records.push(record);
    synced.push(mapping);
  }

  addLog({
    action: "notion.sync.push",
    detail: `${synced.length} Company OS operating record(s) pushed without PHI.`,
    direction: "push",
    status: "success",
  });

  return {
    records,
    status: notionStatus(),
    syncedCount: synced.length,
  };
}

export async function pullNotionOs() {
  await bootstrapNotionOs();

  const store = memoryStore();
  const conflicts: Array<{ localId: string; winner: "local" | "remote" }> = [];

  for (const mapping of store.mappings) {
    if (!mapping.localLastEditedAt || !mapping.remoteLastEditedAt) {
      continue;
    }

    const winner = resolveSyncConflict({
      lastSyncedAt: mapping.lastSyncedAt,
      localLastEditedAt: mapping.localLastEditedAt,
      remoteLastEditedAt: mapping.remoteLastEditedAt,
    });

    if (winner === "remote") {
      mapping.lastPulledAt = nowIso();
    }

    if (winner === "remote" && mapping.localLastEditedAt > mapping.lastSyncedAt) {
      conflicts.push({ localId: mapping.localId, winner });
    }
  }

  addLog({
    action: "notion.sync.pull",
    detail:
      conflicts.length > 0
        ? `${conflicts.length} conflict(s) reviewed; newest edit won.`
        : "No remote Company OS changes required local updates.",
    direction: "pull",
    status: conflicts.length > 0 ? "warning" : "success",
  });

  return {
    conflicts,
    pulledCount: store.mappings.length,
    status: notionStatus(),
  };
}

export function createDatabaseSchemaSql(title = "Name") {
  return `CREATE TABLE ("${normalizeText(
    title,
  )}" TITLE, "Status" SELECT('Backlog':gray, 'Next':blue, 'In Progress':yellow, 'Done':green, 'Blocked':red), "Priority" SELECT('Low':gray, 'Medium':yellow, 'High':red), "Summary" RICH_TEXT, "Local ID" RICH_TEXT, "Source" SELECT('Cardigan':green, 'Notion':blue), "Last Edited" DATE)`;
}
