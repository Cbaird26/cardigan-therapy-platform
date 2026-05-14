import {
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  Video,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ButtonLink, Card, SectionHeader, StatusPill } from "@/components/ui";

export const metadata = {
  title: "Client Dashboard",
};

export default function ClientPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-[1fr_0.42fr] md:px-6">
          <div>
            <StatusPill tone="success">Membership active</StatusPill>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Your Cardigan care room
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              A focused home for your match, next session, messages, goals, assessments, and
              consented AI support between appointments.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3 md:justify-end">
            <ButtonLink href="/session/demo-session" icon={Video}>
              Join session
            </ButtonLink>
            <ButtonLink href="/messages/demo-thread" icon={MessageSquareText} variant="secondary">
              Open messages
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-[0.75fr_1.25fr] md:px-6">
          <Card>
            <p className="text-sm font-semibold text-muted">Matched therapist</p>
            <h2 className="mt-3 text-2xl font-semibold">Christopher Michael Baird</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              LMHC-S, NCC, CCMHC, EMDR Certified. Focus: trauma, anxiety, family stress,
              regulation skills.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                ["Next live session", "Tomorrow, 4:30 PM ET", CalendarClock],
                ["Message response target", "Within one business day", MessageSquareText],
                ["Current goals", "Stabilize sleep, reduce panic spikes", ClipboardList],
              ].map(([label, value, Icon]) => (
                <div className="flex gap-3 rounded-lg border border-border bg-background p-3" key={label as string}>
                  <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{label as string}</p>
                    <p className="text-sm text-muted">{value as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <Brain aria-hidden className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">AI skills coach</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Use intake guide, skills coach, or between-session support. Saved items require
                consent and remain therapist-reviewable.
              </p>
              <div className="mt-4">
                <StatusPill tone="warning">Not emergency support</StatusPill>
              </div>
            </Card>

            <Card>
              <ClipboardList aria-hidden className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">This week</h3>
              <ul className="mt-3 grid gap-3 text-sm text-muted">
                {[
                  "Complete PHQ-9 and GAD-7 check-in",
                  "Pin one journal entry for session review",
                  "Confirm live-session camera and room privacy",
                ].map((item) => (
                  <li className="flex gap-2" key={item}>
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="md:col-span-2">
              <SectionHeader
                title="Provider switch request"
                copy="Clients can request a different clinician while preserving membership status, intake history, consent records, and audit events."
              />
              <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/providers" variant="secondary">
                  Review provider
                </ButtonLink>
                <ButtonLink href="/start">
                  Update preferences
                </ButtonLink>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
