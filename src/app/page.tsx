import {
  ArrowRight,
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";
import Image from "next/image";
import { SiteShell } from "@/components/site-shell";
import { ButtonLink, Card, SectionHeader, StatusPill } from "@/components/ui";
import { dashboardMetrics, membershipPlans, providers } from "@/lib/mock-data";
import { publicPath } from "@/lib/public-path";

const workflow = [
  {
    icon: ClipboardList,
    title: "Structured intake",
    copy: "Clients answer concise matching questions, sign core consents, and confirm Florida location before the care workflow opens.",
  },
  {
    icon: UsersRound,
    title: "Network-ready match",
    copy: "The engine scores eligible licensed providers by state, age fit, concerns, modality, availability, and client preferences.",
  },
  {
    icon: MessageSquareText,
    title: "Care room",
    copy: "Clients get secure async messaging, scheduled live sessions, assessments, goals, and therapist-visible AI notes when consented.",
  },
  {
    icon: ShieldCheck,
    title: "Operational review",
    copy: "Admins review credentials, risk flags, billing status, audit events, and provider-switch requests without leaking PHI to vendors.",
  },
];

export default function Home() {
  return (
    <SiteShell>
      <section className="mesh border-b border-border bg-background">
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-[1fr_0.82fr] md:px-6">
          <div className="max-w-3xl">
            <StatusPill tone="success">Florida pilot • HIPAA-ready architecture</StatusPill>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
              Therapy matching with a steadier operating system.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              Cardigan Incorporated gives clients a clear path from intake to matched care:
              membership therapy, secure messaging, live sessions, and safety-bounded support
              between appointments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/start" icon={Sparkles}>
                Start intake
              </ButtonLink>
              <ButtonLink href="/client" icon={ArrowRight} variant="secondary">
                View client app
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-muted sm:grid-cols-3">
              {["No insurance claims in v1", "No PHI in Stripe or logs", "Daily rooms never recorded"].map(
                (item) => (
                  <span className="flex items-center gap-2" key={item}>
                    <CheckCircle2 aria-hidden className="h-4 w-4 text-primary" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <Image
                alt="Cardigan clinical lead"
                className="h-64 w-full object-cover object-center"
                height={640}
                priority
                src={publicPath("/clinical-lead.jpg")}
                width={900}
              />
              <div className="grid gap-4 p-5">
                <div>
                  <p className="text-sm font-semibold text-foreground">Clinical lead</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Christopher Michael Baird, LMHC-S, NCC, CCMHC, EMDR Certified.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {["EMDR", "Telehealth", "Family care"].map((label) => (
                    <span
                      className="rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-semibold"
                      key={label}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {dashboardMetrics.slice(0, 2).map((metric) => (
                <Card key={metric.label}>
                  <p className="text-sm text-muted">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-1 text-xs text-muted">{metric.delta}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Product flow"
            title="A full care workflow, not a static referral page."
            copy="The first build includes the public funnel, role dashboards, secure service boundaries, and integration points for the HIPAA-ready vendor stack."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {workflow.map((item) => (
              <Card key={item.title}>
                <item.icon aria-hidden className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[0.9fr_1.1fr] md:px-6">
          <SectionHeader
            eyebrow="Care model"
            title="Membership care with integrated clinical boundaries."
            copy="Plans are generic billing products. Clinical details stay inside the platform record and audit trail, never in payment metadata, video room names, or notification copy."
          />
          <div className="grid gap-4">
            {membershipPlans.map((plan) => (
              <Card className="grid gap-4 sm:grid-cols-[1fr_auto]" key={plan.code}>
                <div>
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{plan.summary}</p>
                </div>
                <p className="text-2xl font-semibold text-primary">{plan.price}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Provider profile"
            title="One real clinician listed, with network-ready matching."
            copy="The current public demo lists Christopher Michael Baird only. The data model still supports additional verified clinicians after credential review."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{provider.displayName}</h3>
                    <p className="mt-1 text-sm text-muted">{provider.credentials}</p>
                  </div>
                  <StatusPill tone={provider.acceptingClients ? "success" : "warning"}>
                    {provider.acceptingClients ? "Open" : "Waitlist"}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">{provider.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.specialties.slice(0, 4).map((specialty) => (
                    <span
                      className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted"
                      key={specialty}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4 md:px-6">
          {[
            [LockKeyhole, "Cognito-authenticated roles"],
            [Video, "Daily private video rooms"],
            [Brain, "Bedrock guarded AI companion"],
            [CalendarClock, "Scheduling and provider switching"],
          ].map(([Icon, label]) => (
            <div className="rounded-lg border border-white/20 p-5" key={label as string}>
              <Icon aria-hidden className="h-6 w-6" />
              <p className="mt-4 text-lg font-semibold">{label as string}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
