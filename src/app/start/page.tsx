import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ButtonLink, Card, SectionHeader, StatusPill } from "@/components/ui";
import { computeMatchCandidates } from "@/lib/matching";
import { defaultIntake, providers } from "@/lib/mock-data";

export const metadata = {
  title: "Start Intake",
};

export default function StartPage() {
  const matches = computeMatchCandidates(defaultIntake, providers).slice(0, 3);

  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.92fr_1.08fr] md:px-6">
          <div>
            <SectionHeader
              eyebrow="Start"
              title="A clean intake that turns needs into safe matching signals."
              copy="This v1 intake avoids free-text PHI collection where possible, captures consent, and routes only eligible Florida clients into matching."
            />
            <div className="mt-6 grid gap-3">
              {[
                ["Florida location check", MapPin],
                ["Telehealth and payment consent gates", ShieldCheck],
                ["AI companion opt-in", Brain],
                ["Provider match shortlist", ClipboardCheck],
              ].map(([label, Icon]) => (
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
            <form className="grid gap-5" action="/api/onboarding" method="post">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="state">
                  State at time of session
                </label>
                <select
                  className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
                  defaultValue="FL"
                  id="state"
                  name="clientState"
                >
                  <option value="FL">Florida</option>
                  <option value="OUT">Outside Florida</option>
                </select>
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-semibold">Age range</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {["child", "teen", "adult"].map((age) => (
                    <label
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm"
                      key={age}
                    >
                      <input defaultChecked={age === "adult"} name="ageRange" type="radio" value={age} />
                      {age}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-semibold">What should care focus on?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {["anxiety", "trauma", "stress", "family", "adhd", "life-transitions"].map(
                    (concern) => (
                      <label
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm"
                        key={concern}
                      >
                        <input
                          defaultChecked={["anxiety", "trauma", "stress"].includes(concern)}
                          name="concerns"
                          type="checkbox"
                          value={concern}
                        />
                        {concern}
                      </label>
                    ),
                  )}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm">
                <input defaultChecked name="consentedToMatch" type="checkbox" value="true" />
                <span>
                  I consent to Cardigan using these answers to generate a provider match shortlist.
                </span>
              </label>

              <ButtonLink href="/client" icon={ArrowRight}>
                Continue to care room
              </ButtonLink>
            </form>
          </Card>
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Demo shortlist"
            title="Example match from the real provider list"
            copy="The API uses the same scoring function shown here. The demo currently returns only Christopher because no other clinicians have been added."
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
