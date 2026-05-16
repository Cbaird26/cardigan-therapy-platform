import { CreditCard, PauseCircle, RefreshCcw, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ButtonLink, Card, SectionHeader, StatusPill } from "@/components/ui";
import { membershipPlans } from "@/lib/mock-data";
import { starterDeposit } from "@/lib/revenue";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Membership"
            title="Simple self-pay plans for the Florida pilot."
            copy="Stripe Billing is isolated from PHI. Plans use generic product names, generic descriptors, and membership IDs only."
          />
          <Card className="mt-8 grid gap-5 border-[#8db69d] bg-[#e7f2ea] md:grid-cols-[1fr_auto]">
            <div>
              <StatusPill tone="success">Available now</StatusPill>
              <h3 className="mt-3 text-2xl font-semibold">{starterDeposit.productName}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#25543b]">
                A generic {starterDeposit.amount} starter payment for onboarding coordination. Do
                not enter symptoms, diagnoses, session notes, or clinical details in Stripe.
              </p>
            </div>
            <div className="grid content-center gap-3 md:justify-items-end">
              <p className="text-3xl font-semibold text-primary">{starterDeposit.amount}</p>
              <ButtonLink href={starterDeposit.paymentUrl} icon={CreditCard}>
                Pay deposit
              </ButtonLink>
            </div>
          </Card>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {membershipPlans.map((plan) => (
              <Card className="flex flex-col" key={plan.code}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{plan.summary}</p>
                  </div>
                  <StatusPill tone="success">v1</StatusPill>
                </div>
                <p className="mt-6 text-4xl font-semibold text-primary">{plan.price}</p>
                <div className="mt-6">
                  <ButtonLink href="/start" icon={CreditCard} variant="secondary">
                    Request review
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3 md:px-6">
          {[
            {
              icon: PauseCircle,
              title: "Pause and cancel",
              copy: "Memberships support pause, cancellation, and past-due states without deleting the clinical record.",
            },
            {
              icon: RefreshCcw,
              title: "Provider switch",
              copy: "Clients can request a switch without restarting intake; admin review preserves continuity.",
            },
            {
              icon: ShieldCheck,
              title: "Billing isolation",
              copy: "No symptoms, diagnoses, provider names, session details, or notes are sent to Stripe metadata.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <item.icon aria-hidden className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
            </Card>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
