import { SiteShell } from "@/components/site-shell";
import { SectionHeader, StatusPill } from "@/components/ui";
import { ProviderPracticeDashboard } from "./provider-practice-dashboard";

export const metadata = {
  title: "Provider Dashboard",
};

export default function ProviderPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <StatusPill tone="success">Provider workspace</StatusPill>
          <SectionHeader
            title="Christopher's simple practice backend."
            copy="Review client requests, update intake status, see the roster, create notes, and watch sessions or risk flags from the local fullstack app."
          />
        </div>
      </section>

      <section className="bg-surface py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <ProviderPracticeDashboard />
        </div>
      </section>
    </SiteShell>
  );
}
