import { CalendarDays, LockKeyhole, UsersRound } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, SectionHeader, StatusPill } from "@/components/ui";

export const metadata = {
  title: "Groups",
};

export default function GroupsPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Optional group sessions"
            title="Therapist-led groups that complement individual care."
            copy="Groups are membership-aware, consent-gated, and designed for skills practice rather than replacing individual therapy."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: UsersRound,
                title: "Anxiety skills lab",
                copy: "A structured weekly group for grounding, avoidance loops, and workplace stress practice.",
                status: "pilot-ready",
              },
              {
                icon: CalendarDays,
                title: "Caregiver reset",
                copy: "Support for parents and caregivers building calmer routines and repair conversations at home.",
                status: "waitlist",
              },
              {
                icon: LockKeyhole,
                title: "Trauma stabilization",
                copy: "Psychoeducation and resourcing only; trauma processing remains individual-session work.",
                status: "clinical review",
              },
            ].map((group) => (
              <Card key={group.title}>
                <group.icon aria-hidden className="h-6 w-6 text-primary" />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{group.title}</h3>
                  <StatusPill>{group.status}</StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{group.copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
