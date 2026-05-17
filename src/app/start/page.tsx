import {
  Brain,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, SectionHeader, StatusPill } from "@/components/ui";
import { clinicalBooking } from "@/lib/booking";
import { computeMatchCandidates } from "@/lib/matching";
import { defaultIntake, providers } from "@/lib/mock-data";
import { IntakeForm } from "./intake-form";

export const metadata = {
  title: "Start Intake",
};

const isStaticPreview = process.env.NEXT_PUBLIC_CARDIGAN_STATIC_PREVIEW === "true";

export default function StartPage() {
  const matches = computeMatchCandidates(defaultIntake, providers).slice(0, 3);
  const startSteps = isStaticPreview
    ? [
        [clinicalBooking.isSimplePracticeEnabled ? "SimplePractice booking" : "Starter deposit", ShieldCheck],
        ["No PHI in public pages", ShieldCheck],
        ["Secure portal follow-up", ClipboardCheck],
        ["Christopher-only Florida pilot", MapPin],
      ]
    : [
        ["Florida location check", MapPin],
        ["Telehealth and payment consent gates", ShieldCheck],
        ["AI companion opt-in", Brain],
        ["Provider match shortlist", ClipboardCheck],
      ];

  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.92fr_1.08fr] md:px-6">
          <div>
            <SectionHeader
              eyebrow="Start"
              title={
                isStaticPreview
                  ? "Start through the secure clinical portal."
                  : "A clean intake that turns needs into safe matching signals."
              }
              copy={
                isStaticPreview
                  ? "Request a consult through SimplePractice for client portal registration, booking, payment, and telehealth. Do not enter symptoms, diagnoses, or session details in public payment or ad fields."
                  : "This v1 intake avoids free-text PHI collection where possible, captures consent, and routes only eligible Florida clients into matching."
              }
            />
            <div className="mt-6 grid gap-3">
              {startSteps.map(([label, Icon]) => (
                <div
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  key={label as string}
                >
                  <Icon aria-hidden className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{label as string}</span>
                </div>
              ))}
            </div>
          </div>

          <Card>
            <IntakeForm />
          </Card>
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Match shortlist"
            title="Example match from the real provider list"
            copy="The API uses the same scoring function shown here. It returns only Christopher because no other clinicians have been credentialed for v1."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {matches.map((match) => (
              <Card key={match.provider.id}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{match.provider.displayName}</h3>
                  <StatusPill tone="success">{match.score}%</StatusPill>
                </div>
                <p className="mt-2 text-sm text-muted">{match.provider.credentials}</p>
                <ul className="mt-4 grid gap-2 text-sm text-muted">
                  {match.reasons.slice(0, 3).map((reason) => (
                    <li className="flex gap-2" key={reason}>
                      <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
