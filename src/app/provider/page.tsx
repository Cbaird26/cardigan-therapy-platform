import {
  AlertTriangle,
  CalendarClock,
  ClipboardPenLine,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ButtonLink, Card, SectionHeader, StatusPill } from "@/components/ui";

export const metadata = {
  title: "Provider Dashboard",
};

export default function ProviderPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <StatusPill tone="success">Provider workspace</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Today&apos;s clinical queue
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            A therapist-first dashboard for upcoming sessions, client messages, notes, goals,
            AI-saved entries, and risk review.
          </p>
        </div>
      </section>

      <section className="bg-surface py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-[1fr_0.95fr] md:px-6">
          <div className="grid gap-4">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted">Next session</p>
                  <h2 className="mt-2 text-2xl font-semibold">Demo client • 4:30 PM ET</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Telehealth room opens 15 minutes before start. Recording disabled by policy.
                  </p>
                </div>
                <CalendarClock aria-hidden className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/session/demo-session">Open room</ButtonLink>
                <ButtonLink href="/messages/demo-thread" icon={MessageSquareText} variant="secondary">
                  Message client
                </ButtonLink>
              </div>
            </Card>

            <Card>
              <SectionHeader
                title="Assigned clients"
                copy="Clinical details remain inside the authenticated provider workspace and audit trail."
              />
              <div className="mt-5 grid gap-3">
                {[
                  ["Demo client A", "GAD-7 due", "Tomorrow session"],
                  ["Demo client B", "AI journal pinned", "Risk: low"],
                  ["Demo client C", "Provider switch requested", "Admin reviewing"],
                ].map(([name, detail, status]) => (
                  <div
                    className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_auto]"
                    key={name}
                  >
                    <div>
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-muted">{detail}</p>
                    </div>
                    <StatusPill>{status}</StatusPill>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: AlertTriangle,
                title: "Risk review",
                copy: "Three open flags. Crisis-level AI/chat events route to emergency copy and admin/provider review.",
                tone: "danger" as const,
              },
              {
                icon: ClipboardPenLine,
                title: "Notes",
                copy: "Draft progress notes can be linked to sessions, locked, exported, and audited.",
                tone: "neutral" as const,
              },
              {
                icon: UsersRound,
                title: "Supervision",
                copy: "Supervisor role can review assigned providers without broad admin billing permissions.",
                tone: "success" as const,
              },
              {
                icon: ShieldCheck,
                title: "Consent gates",
                copy: "Telehealth, payment, AI, terms, and privacy artifacts are checked before clinical workflows.",
                tone: "warning" as const,
              },
            ].map((item) => (
              <Card key={item.title}>
                <div className="flex items-start gap-3">
                  <item.icon aria-hidden className="mt-1 h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <StatusPill tone={item.tone}>{item.tone}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
