import { AlertTriangle, Brain, Send, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, SectionHeader, StatusPill } from "@/components/ui";

export const metadata = {
  title: "Messages",
};

export function generateStaticParams() {
  return [{ threadId: "demo-thread" }];
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <StatusPill tone="success">Secure thread</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Client and therapist messaging
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            Thread `{threadId}` demonstrates async support, risk scanning, pinned items, and
            therapist-visible AI entries when consented.
          </p>
        </div>
      </section>

      <section className="bg-surface py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-[1fr_0.38fr] md:px-6">
          <Card className="grid min-h-[640px] grid-rows-[auto_1fr_auto]">
            <div className="border-b border-border pb-4">
              <p className="font-semibold">Christopher Michael Baird</p>
              <p className="text-sm text-muted">Response target: one business day</p>
            </div>

            <div className="grid content-start gap-4 py-5">
              {[
                ["demo client", "I had a panic spike before work and used the long-exhale skill."],
                ["therapist", "Good use of the skill. Please pin what happened before the spike so we can map the pattern tomorrow."],
                ["ai", "Pinned AI skills note: jaw unclench, shoulder drop, inhale four, exhale six."],
              ].map(([sender, body]) => (
                <div
                  className={`max-w-[78%] rounded-lg border p-4 text-sm leading-6 ${
                    sender === "client"
                      ? "ml-auto border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground"
                  }`}
                  key={body}
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] opacity-75">
                    {sender}
                  </p>
                  {body}
                </div>
              ))}
            </div>

            <form className="grid gap-3 border-t border-border pt-4">
              <label className="sr-only" htmlFor="message">
                Message
              </label>
              <textarea
                className="cardigan-focus min-h-28 resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm"
                id="message"
                placeholder="Write a message for your care team..."
              />
              <button
                className="cardigan-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                type="button"
              >
                <Send aria-hidden className="h-4 w-4" />
                Send safely
              </button>
            </form>
          </Card>

          <div className="grid gap-4">
            <Card>
              <SectionHeader
                title="Message safety"
                copy="Messages are scanned for crisis language before persistence. Crisis text triggers emergency copy and a review flag."
              />
              <div className="mt-5 grid gap-3">
                <div className="flex gap-3 rounded-lg border border-border bg-surface-muted p-3">
                  <AlertTriangle aria-hidden className="h-5 w-5 text-[var(--danger)]" />
                  <p className="text-sm text-muted">High-risk messages escalate to provider/admin review.</p>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-surface-muted p-3">
                  <ShieldCheck aria-hidden className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted">No clinical message text is sent to Stripe, Daily, or notifications.</p>
                </div>
              </div>
            </Card>

            <Card>
              <Brain aria-hidden className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">AI companion modes</h2>
              <ul className="mt-3 grid gap-2 text-sm text-muted">
                <li>Intake guide</li>
                <li>Skills coach</li>
                <li>Between-session support</li>
              </ul>
              <p className="mt-4 text-sm leading-6 text-muted">
                Saved AI entries require consent and stay visible to the therapist according to the
                record policy.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
