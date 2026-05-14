import {
  BadgeCheck,
  DatabaseZap,
  FileWarning,
  Gauge,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, SectionHeader, StatusPill } from "@/components/ui";
import { dashboardMetrics } from "@/lib/mock-data";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <StatusPill tone="warning">Admin console</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Operations, compliance, and marketplace control.
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            The admin surface manages credentialing, risk flags, provider switches, billing state,
            audit exports, and vendor configuration without becoming a full EHR.
          </p>
        </div>
      </section>

      <section className="bg-surface py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-4 md:px-6">
          {dashboardMetrics.map((metric) => (
            <Card key={metric.label}>
              <p className="text-sm text-muted">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
              <p className="mt-1 text-xs text-muted">{metric.delta}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-background py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-[1fr_1fr] md:px-6">
          <Card>
            <SectionHeader
              title="Launch checklist"
              copy="Production remains blocked until these compliance and vendor gates are complete."
            />
            <div className="mt-5 grid gap-3">
              {[
                ["AWS BAA signed and HIPAA-eligible services constrained", ShieldCheck, "warning"],
                ["Daily Healthcare/HIPAA add-on active", BadgeCheck, "warning"],
                ["Stripe telehealth approval and metadata review", FileWarning, "warning"],
                ["Clinical/legal review of AI companion language", ListChecks, "danger"],
              ].map(([label, Icon, tone]) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3"
                  key={label as string}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <Icon aria-hidden className="h-5 w-5 text-primary" />
                    {label as string}
                  </span>
                  <StatusPill tone={tone as "warning" | "danger"}>required</StatusPill>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader
              title="System boundaries"
              copy="These controls are encoded in the helper functions, API surfaces, and infrastructure scaffold."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: DatabaseZap,
                  title: "PHI boundary",
                  copy: "Clinical data remains in Postgres/S3 with KMS and audit controls.",
                },
                {
                  icon: Gauge,
                  title: "Audit export",
                  copy: "Every sensitive action is designed to produce an append-only audit event.",
                },
                {
                  icon: ShieldCheck,
                  title: "Role access",
                  copy: "Client, therapist, supervisor, and admin permissions are explicit.",
                },
                {
                  icon: FileWarning,
                  title: "Risk flow",
                  copy: "Crisis language routes to emergency copy and review flags, not AI continuation.",
                },
              ].map((item) => (
                <div className="rounded-lg border border-border bg-surface-muted p-4" key={item.title}>
                  <item.icon aria-hidden className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </SiteShell>
  );
}
