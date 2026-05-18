"use client";

import {
  Bell,
  BellRing,
  CalendarClock,
  Cloud,
  Download,
  ExternalLink,
  FileCheck2,
  LogOut,
  MessageSquareText,
  NotebookPen,
  RefreshCcw,
  ShieldCheck,
  Upload,
  UsersRound,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonLink, Card, SectionHeader, StatusPill } from "@/components/ui";

type ReviewStatus = "submitted" | "reviewed" | "accepted" | "needs-info" | "declined";

type PracticeClient = {
  ageRange?: string;
  concerns?: string[];
  id: string;
  legalName?: string;
  modalityPreference?: string;
  phone?: string;
  preferredName?: string;
  state?: string;
  user?: { email?: string };
};

type PracticeIntake = {
  client?: PracticeClient;
  clientId: string;
  createdAt?: string;
  id: string;
  reviewNote?: string;
  reviewStatus?: ReviewStatus;
  status?: string;
};

type PracticeSnapshot = {
  authenticatedProvider?: {
    displayName: string;
    email: string;
    providerId: string;
  };
  alertConfig?: {
    dashboard: boolean;
    emailWebhook: boolean;
    googleVoiceNumberConfigured: boolean;
    notionWebhook: boolean;
    smsWebhook: boolean;
    webhook: boolean;
  };
  clients: PracticeClient[];
  intakes: PracticeIntake[];
  notes: Array<{
    body?: string;
    clientId?: string;
    createdAt?: string;
    id: string;
    title?: string;
  }>;
  openRiskFlags: Array<{
    createdAt?: string;
    id: string;
    severity?: string;
    source?: string;
    summary?: string;
  }>;
  provider?: {
    credentials?: string;
    id: string;
    user?: { displayName?: string; email?: string };
  };
  providerAlerts?: Array<{
    body: string;
    createdAt?: string;
    deliveryStatus?: Array<{ channel: string; status: string }>;
    id: string;
    priority?: "normal" | "high" | "urgent";
    readAt?: string | null;
    title: string;
    type?: string;
  }>;
  sessions: Array<{
    client?: PracticeClient;
    clientId?: string;
    endsAt?: string;
    id: string;
    startsAt?: string;
    status?: string;
  }>;
  storageMode: "memory" | "prisma";
};

type NotionStatus = {
  hipaa: {
    baaRequiredForPhi: boolean;
    phiSyncEnabled: boolean;
    scope: string;
  };
  lastSyncAt: string | null;
  logs: Array<{
    action: string;
    createdAt: string;
    detail: string;
    direction: "bootstrap" | "push" | "pull";
    id: string;
    status: "success" | "warning" | "error";
  }>;
  mappings: number;
  mode: "local-memory" | "notion-api";
  osPageId: string | null;
  ready: boolean;
};

const isStaticPreview = process.env.NEXT_PUBLIC_CARDIGAN_STATIC_PREVIEW === "true";
const reviewStatuses: ReviewStatus[] = ["submitted", "reviewed", "accepted", "needs-info", "declined"];

function displayClientName(client?: PracticeClient) {
  if (!client) {
    return "Client pending";
  }

  return client.preferredName ?? client.legalName ?? client.user?.email ?? "Client pending";
}

function formatDate(value?: string) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status?: string): "neutral" | "success" | "warning" | "danger" {
  if (status === "accepted" || status === "reviewed") {
    return "success";
  }

  if (status === "needs-info" || status === "submitted") {
    return "warning";
  }

  if (status === "declined") {
    return "danger";
  }

  return "neutral";
}

export function ProviderPracticeDashboard() {
  const [snapshot, setSnapshot] = useState<PracticeSnapshot | null>(null);
  const [notionStatus, setNotionStatus] = useState<NotionStatus | null>(null);
  const [notionMessage, setNotionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isStaticPreview);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingNotion, setIsSyncingNotion] = useState(false);
  const notifiedAlertIds = useRef<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const loadNotionStatus = useCallback(async () => {
    if (isStaticPreview) {
      return null;
    }

    const response = await fetch("/api/notion/status", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Notion Company OS status could not load.");
    }

    setNotionStatus(data);
    return data as NotionStatus;
  }, []);

  const loadPractice = useCallback(async () => {
    if (isStaticPreview) {
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/provider/practice", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Provider login required.");
      }

      setSnapshot(data);
      await loadNotionStatus().catch(() => undefined);
    } catch (loadError) {
      setSnapshot(null);
      setError(loadError instanceof Error ? loadError.message : "Provider workspace could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [loadNotionStatus]);

  useEffect(() => {
    if (isStaticPreview) {
      return;
    }

    let isActive = true;

    async function loadInitialPractice() {
      try {
        const response = await fetch("/api/provider/practice", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Provider login required.");
        }

        if (isActive) {
          setSnapshot(data);
          setError(null);
        }
        await loadNotionStatus().catch(() => undefined);
      } catch (loadError) {
        if (isActive) {
          setSnapshot(null);
          setError(loadError instanceof Error ? loadError.message : "Provider workspace could not load.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialPractice();

    return () => {
      isActive = false;
    };
  }, [loadNotionStatus]);

  useEffect(() => {
    if (isStaticPreview) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadPractice();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [loadPractice]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const unreadAlerts = (snapshot?.providerAlerts ?? []).filter((alert) => !alert.readAt);

    for (const alert of unreadAlerts) {
      if (notifiedAlertIds.current.has(alert.id)) {
        continue;
      }

      new Notification(alert.title, {
        body: alert.body,
        tag: alert.id,
      });
      notifiedAlertIds.current.add(alert.id);
    }
  }, [snapshot?.providerAlerts]);

  const clientOptions = useMemo(() => {
    const byId = new Map<string, PracticeClient>();

    for (const intake of snapshot?.intakes ?? []) {
      if (intake.client) {
        byId.set(intake.client.id, intake.client);
      }
    }

    for (const client of snapshot?.clients ?? []) {
      byId.set(client.id, client);
    }

    return [...byId.values()];
  }, [snapshot]);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/provider/intakes/status", {
        body: JSON.stringify({
          intakeId: form.get("intakeId"),
          reviewNote: form.get("reviewNote"),
          status: form.get("status"),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Status could not be updated.");
      }

      await loadPractice();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Status could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function createNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const noteForm = event.currentTarget;
    setIsSaving(true);
    setError(null);
    const form = new FormData(noteForm);

    try {
      const response = await fetch("/api/notes", {
        body: JSON.stringify({
          body: form.get("body"),
          clientId: form.get("clientId"),
          providerId: snapshot?.authenticatedProvider?.providerId ?? "provider-cmb",
          title: form.get("title"),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Note could not be saved.");
      }

      noteForm.reset();
      await loadPractice();
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Note could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runNotionAction(endpoint: string, successMessage: string) {
    setIsSyncingNotion(true);
    setNotionMessage(null);
    setError(null);

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Notion Company OS sync failed.");
      }

      setNotionStatus(data.status ?? data);
      setNotionMessage(successMessage);
      await loadNotionStatus();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Notion Company OS sync failed.");
    } finally {
      setIsSyncingNotion(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSnapshot(null);
    setNotionStatus(null);
    setError("Provider logged out.");
  }

  async function enableDesktopAlerts() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  async function markAlertRead(alertId: string) {
    setError(null);

    try {
      const response = await fetch("/api/provider/alerts/read", {
        body: JSON.stringify({ alertId }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Alert could not be marked reviewed.");
      }

      await loadPractice();
    } catch (alertError) {
      setError(alertError instanceof Error ? alertError.message : "Alert could not be marked reviewed.");
    }
  }

  if (isStaticPreview) {
    return (
      <div className="grid gap-4">
        <Card>
          <SectionHeader
            title="Provider login requires the fullstack app."
            copy="GitHub Pages is the static public site. The working provider queue runs on the local Next.js server at http://127.0.0.1:3000."
          />
          <div className="mt-5">
            <ButtonLink href="/provider-login" variant="secondary">
              Provider login
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm font-semibold text-muted">Loading provider workspace...</p>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card>
        <SectionHeader
          title="Provider login required."
          copy="Sign in as Christopher to review client requests, update intake status, and manage simple practice notes."
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/provider-login">Provider login</ButtonLink>
          <Button icon={RefreshCcw} onClick={loadPractice} type="button" variant="secondary">
            Retry
          </Button>
        </div>
        {error ? (
          <p className="mt-4 rounded-lg border border-[#d99999] bg-[#f7dddd] p-4 text-sm text-[#7d2626]">
            {error}
          </p>
        ) : null}
      </Card>
    );
  }

  const providerAlerts = snapshot.providerAlerts ?? [];
  const unreadAlertCount = providerAlerts.filter((alert) => !alert.readAt).length;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Requests", snapshot.intakes.length.toString(), FileCheck2, "warning" as const],
          ["Clients", clientOptions.length.toString(), UsersRound, "success" as const],
          ["Sessions", snapshot.sessions.length.toString(), CalendarClock, "neutral" as const],
          [
            "Alerts",
            unreadAlertCount.toString(),
            unreadAlertCount ? BellRing : Bell,
            unreadAlertCount ? "danger" as const : "success" as const,
          ],
        ].map(([label, value, Icon, tone]) => (
          <Card key={label as string}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{label as string}</p>
                <p className="mt-2 text-3xl font-semibold">{value as string}</p>
              </div>
              <Icon aria-hidden className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-3">
              <StatusPill tone={tone as "neutral" | "success" | "warning" | "danger"}>
                {snapshot.storageMode}
              </StatusPill>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted">Signed in provider</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {snapshot.authenticatedProvider?.displayName ?? "Christopher Michael Baird"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {snapshot.provider?.credentials ?? "LMHC-S, NCC, CCMHC, EMDR Certified"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              icon={RefreshCcw}
              onClick={() => {
                void loadPractice();
              }}
              type="button"
              variant="secondary"
            >
              Refresh
            </Button>
            <Button icon={LogOut} onClick={logout} type="button" variant="ghost">
              Logout
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-4 rounded-lg border border-[#d99999] bg-[#f7dddd] p-4 text-sm text-[#7d2626]">
            {error}
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            title="Provider alerts"
            copy="Every Cardigan-side request, secure message, scheduling request, and safety escalation creates a generic alert without contact details, message text, or clinical content."
          />
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="success">Dashboard on</StatusPill>
            <StatusPill tone={notificationPermission === "granted" ? "success" : "warning"}>
              Desktop {notificationPermission}
            </StatusPill>
            <StatusPill tone={snapshot.alertConfig?.smsWebhook ? "success" : "warning"}>
              Text bridge {snapshot.alertConfig?.smsWebhook ? "on" : "needs setup"}
            </StatusPill>
            <StatusPill tone={snapshot.alertConfig?.googleVoiceNumberConfigured ? "success" : "neutral"}>
              Google Voice noted
            </StatusPill>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}
            icon={BellRing}
            onClick={() => {
              void enableDesktopAlerts();
            }}
            type="button"
            variant="secondary"
          >
            Enable desktop alerts
          </Button>
          <Button
            icon={RefreshCcw}
            onClick={() => {
              void loadPractice();
            }}
            type="button"
            variant="ghost"
          >
            Check now
          </Button>
        </div>
        <div className="mt-5 grid gap-3">
          {providerAlerts.length ? (
            providerAlerts.slice(0, 8).map((alert) => (
              <div
                className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_auto]"
                key={alert.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <StatusPill
                      tone={
                        alert.priority === "urgent"
                          ? "danger"
                          : alert.priority === "high"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {alert.priority ?? "normal"}
                    </StatusPill>
                    {!alert.readAt ? <StatusPill tone="danger">unread</StatusPill> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{alert.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(alert.createdAt)}</p>
                </div>
                <Button
                  disabled={Boolean(alert.readAt)}
                  onClick={() => {
                    void markAlertRead(alert.id);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Mark reviewed
                </Button>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted">
              No provider alerts yet. New secure activity will appear here and refresh every 30 seconds.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            title="Notion Company OS"
            copy="Operational workspace sync only. Clinical records, contact details, messages, notes, symptoms, and intake answers stay out of Notion."
          />
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={notionStatus?.ready ? "success" : "warning"}>
              {notionStatus?.mode ?? "checking"}
            </StatusPill>
            <StatusPill tone="success">PHI sync off</StatusPill>
            <StatusPill tone="neutral">{notionStatus?.mappings ?? 0} mapped</StatusPill>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-lg border border-border bg-background p-4 text-sm leading-6 text-muted">
            <p>
              Last sync:{" "}
              <span className="font-semibold text-foreground">
                {notionStatus?.lastSyncAt ? formatDate(notionStatus.lastSyncAt) : "Not synced yet"}
              </span>
            </p>
            <p>
              Scope:{" "}
              <span className="font-semibold text-foreground">
                {notionStatus?.hipaa.scope ?? "Company OS only"}
              </span>
            </p>
            {notionStatus?.logs[0] ? (
              <p>
                Latest:{" "}
                <span className="font-semibold text-foreground">{notionStatus.logs[0].detail}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button
              disabled={isSyncingNotion}
              icon={Cloud}
              onClick={() =>
                void runNotionAction("/api/notion/bootstrap", "Cardigan OS configuration initialized.")
              }
              type="button"
              variant="secondary"
            >
              Bootstrap OS
            </Button>
            <Button
              disabled={isSyncingNotion}
              icon={Upload}
              onClick={() =>
                void runNotionAction("/api/notion/sync/push", "Company OS records pushed without PHI.")
              }
              type="button"
            >
              Push to Notion
            </Button>
            <Button
              disabled={isSyncingNotion}
              icon={Download}
              onClick={() =>
                void runNotionAction("/api/notion/sync/pull", "Company OS pull complete.")
              }
              type="button"
              variant="secondary"
            >
              Pull from Notion
            </Button>
            {notionStatus?.osPageId && !notionStatus.osPageId.startsWith("local_") ? (
              <ButtonLink
                href={`https://www.notion.so/${notionStatus.osPageId.replaceAll("-", "")}`}
                icon={ExternalLink}
                variant="ghost"
              >
                Open Cardigan OS
              </ButtonLink>
            ) : (
              <Button disabled icon={ExternalLink} type="button" variant="ghost">
                Open Cardigan OS
              </Button>
            )}
          </div>
        </div>
        {notionMessage ? (
          <p className="mt-4 rounded-lg border border-[#8db69d] bg-[#e7f2ea] p-4 text-sm text-[#25543b]">
            {notionMessage}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeader
            title="Client request queue"
            copy="New local fullstack submissions appear here without restarting the app."
          />
          <div className="mt-5 grid gap-3">
            {snapshot.intakes.length ? (
              snapshot.intakes.map((intake) => (
                <form
                  className="grid gap-4 rounded-lg border border-border bg-background p-4"
                  key={intake.id}
                  onSubmit={updateStatus}
                >
                  <input name="intakeId" type="hidden" value={intake.id} />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{displayClientName(intake.client)}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {intake.client?.user?.email ?? "No email"} | {intake.client?.phone ?? "No phone"} |{" "}
                        {intake.client?.state ?? "State pending"}
                      </p>
                      <p className="text-sm leading-6 text-muted">
                        {intake.client?.ageRange ?? "age pending"} |{" "}
                        {(intake.client?.concerns ?? []).join(", ") || "concerns pending"} |{" "}
                        {intake.client?.modalityPreference ?? "modality pending"}
                      </p>
                      <p className="mt-1 text-xs text-muted">Submitted {formatDate(intake.createdAt)}</p>
                    </div>
                    <StatusPill tone={statusTone(intake.reviewStatus)}>
                      {intake.reviewStatus ?? "submitted"}
                    </StatusPill>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[0.5fr_1fr_auto]">
                    <select
                      className="cardigan-focus rounded-lg border border-border bg-surface px-3 py-3 text-sm"
                      defaultValue={intake.reviewStatus ?? "submitted"}
                      name="status"
                    >
                      {reviewStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <input
                      className="cardigan-focus rounded-lg border border-border bg-surface px-3 py-3 text-sm"
                      defaultValue={intake.reviewNote ?? ""}
                      name="reviewNote"
                      placeholder="Review note"
                      type="text"
                    />
                    <Button disabled={isSaving} icon={ShieldCheck} type="submit">
                      Save status
                    </Button>
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted">
                No client requests yet. Submit the Start form as a client, then return here.
              </p>
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <SectionHeader title="Simple note" copy="Create a lightweight provider note for a matched client." />
            <form className="mt-5 grid gap-3" onSubmit={createNote}>
              <select
                className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3 text-sm"
                disabled={!clientOptions.length}
                name="clientId"
                required
              >
                <option value="">Select client</option>
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {displayClientName(client)}
                  </option>
                ))}
              </select>
              <input
                className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3 text-sm"
                name="title"
                placeholder="Note title"
                required
                type="text"
              />
              <textarea
                className="cardigan-focus min-h-28 rounded-lg border border-border bg-background px-3 py-3 text-sm"
                name="body"
                placeholder="Provider note"
                required
              />
              <Button disabled={isSaving || !clientOptions.length} icon={NotebookPen} type="submit">
                Save note
              </Button>
            </form>
          </Card>

          <Card>
            <SectionHeader title="Recent notes" />
            <div className="mt-4 grid gap-3">
              {snapshot.notes.length ? (
                snapshot.notes.map((note) => (
                  <div className="rounded-lg border border-border bg-background p-3" key={note.id}>
                    <p className="text-sm font-semibold">{note.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{note.body}</p>
                    <p className="mt-2 text-xs text-muted">{formatDate(note.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No notes yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Sessions and risk" />
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2 font-semibold">
                  <CalendarClock aria-hidden className="h-4 w-4 text-primary" />
                  Session requests
                </div>
                <p className="mt-1 text-muted">
                  {snapshot.sessions.length
                    ? `${snapshot.sessions.length} request(s) on the practice calendar.`
                    : "No session requests yet."}
                </p>
                {snapshot.sessions.length ? (
                  <div className="mt-3 grid gap-2">
                    {snapshot.sessions.slice(0, 5).map((session) => (
                      <div
                        className="rounded-md border border-border bg-surface px-3 py-2"
                        key={session.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold">{displayClientName(session.client)}</span>
                          <StatusPill tone="warning">{session.status ?? "REQUESTED"}</StatusPill>
                        </div>
                        <p className="mt-1 text-xs text-muted">{formatDate(session.startsAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2 font-semibold">
                  <MessageSquareText aria-hidden className="h-4 w-4 text-primary" />
                  Risk flags
                </div>
                <p className="mt-1 text-muted">
                  {snapshot.openRiskFlags.length
                    ? `${snapshot.openRiskFlags.length} open flag(s) require review.`
                    : "No open risk flags."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
