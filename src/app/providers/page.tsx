import { Award, CalendarClock, MapPin, UserCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, SectionHeader, StatusPill } from "@/components/ui";
import { providers } from "@/lib/mock-data";

export const metadata = {
  title: "Providers",
};

export default function ProvidersPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Provider"
            title="The public provider list includes only the real clinical lead."
            copy="The platform remains ready for a curated provider network, but additional clinicians should appear only after credentialing and consent to publish."
          />
          <div className="mt-8 grid gap-4">
            {providers.map((provider) => (
              <Card className="grid gap-6 md:grid-cols-[1fr_0.7fr]" key={provider.id}>
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-semibold">{provider.displayName}</h3>
                      <p className="mt-1 text-sm text-muted">{provider.credentials}</p>
                    </div>
                    <StatusPill tone={provider.acceptingClients ? "success" : "warning"}>
                      {provider.acceptingClients ? "Accepting clients" : "Waitlist"}
                    </StatusPill>
                  </div>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">{provider.bio}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      ...provider.specialties.map((item) => ({ item, type: "specialty" })),
                      ...provider.modalities.map((item) => ({ item, type: "modality" })),
                    ].map(({ item, type }) => (
                      <span
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted"
                        key={`${type}-${item}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                    <MapPin aria-hidden className="h-5 w-5 text-primary" />
                    Licensed pilot states: {provider.states.join(", ")}
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                    <CalendarClock aria-hidden className="h-5 w-5 text-primary" />
                    Next opening: {provider.nextAvailable}
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                    <UserCheck aria-hidden className="h-5 w-5 text-primary" />
                    {provider.acceptsMinors ? "Accepts minors" : "Adults only"}
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                    <Award aria-hidden className="h-5 w-5 text-primary" />
                    Credential verification required before production activation
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
