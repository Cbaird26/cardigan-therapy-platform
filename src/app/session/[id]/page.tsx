import { Mic, PhoneOff, Settings, ShieldCheck, Video } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ButtonLink, Card, StatusPill } from "@/components/ui";

export const metadata = {
  title: "Live Session",
};

export function generateStaticParams() {
  return [{ id: "demo-session" }];
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SiteShell>
      <section className="min-h-[calc(100vh-80px)] bg-[#171612] py-8 text-[#f8f4ee]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-[1fr_0.34fr] md:px-6">
          <div className="overflow-hidden rounded-lg border border-white/15 bg-[#242119]">
            <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
              <div>
                <p className="text-sm text-[#c8bdaa]">Session ID</p>
                <h1 className="font-semibold">{id}</h1>
              </div>
              <StatusPill tone="success">Daily private room</StatusPill>
            </div>
            <div className="grid min-h-[520px] place-items-center px-5 py-10">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg border border-white/20 bg-[#315f52]">
                  <Video aria-hidden className="h-10 w-10" />
                </div>
                <h2 className="mt-6 text-3xl font-semibold">Video room placeholder</h2>
                <p className="mx-auto mt-3 max-w-xl leading-7 text-[#c8bdaa]">
                  The API creates a random Daily room with recording disabled. In production this
                  panel embeds the Daily call object after auth, consent, and session-time checks.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/15 px-4 py-4">
              {[Mic, Video, Settings].map((Icon, index) => (
                <button
                  aria-label={["Toggle microphone", "Toggle camera", "Open settings"][index]}
                  className="cardigan-focus flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white"
                  key={index}
                  type="button"
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </button>
              ))}
              <ButtonLink href="/client" icon={PhoneOff} variant="secondary">
                Leave
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-white/15 bg-[#242119] text-[#f8f4ee]">
              <ShieldCheck aria-hidden className="h-6 w-6 text-[#88b9a5]" />
              <h2 className="mt-4 text-xl font-semibold">Session safeguards</h2>
              <ul className="mt-4 grid gap-3 text-sm text-[#c8bdaa]">
                <li>Client and provider must be authenticated.</li>
                <li>Telehealth consent must be signed.</li>
                <li>Daily room name contains no PHI.</li>
                <li>Recording is disabled in v1.</li>
              </ul>
            </Card>
            <Card className="border-white/15 bg-[#242119] text-[#f8f4ee]">
              <h2 className="text-xl font-semibold">Clinical note</h2>
              <p className="mt-3 text-sm leading-6 text-[#c8bdaa]">
                Providers can draft and lock a note after the session. Notes stay in the platform
                record and are never copied to the video vendor.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
