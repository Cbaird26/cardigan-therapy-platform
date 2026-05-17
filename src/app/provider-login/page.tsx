import { BadgeCheck, LockKeyhole, UserRoundCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, SectionHeader } from "@/components/ui";
import { ProviderLoginForm } from "./provider-login-form";

export const metadata = {
  title: "Provider Login",
};

export default function ProviderLoginPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-background py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.9fr_1.1fr] md:px-6">
          <div>
            <SectionHeader
              eyebrow="Provider login"
              title="Simple practice workspace for Christopher."
              copy="The local fullstack app lets the provider receive client requests, review status, and keep lightweight practice notes while the production HIPAA stack is prepared."
            />
            <div className="mt-6 grid gap-3">
              {[
                ["One provider account", UserRoundCheck],
                ["Signed HttpOnly session", LockKeyhole],
                ["Request queue and notes", BadgeCheck],
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
            <ProviderLoginForm />
          </Card>
        </div>
      </section>
    </SiteShell>
  );
}
