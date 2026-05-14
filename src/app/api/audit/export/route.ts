import { ok } from "@/lib/api";

export async function GET() {
  return ok({
    generatedAt: new Date().toISOString(),
    format: "json",
    events: [
      {
        id: "audit-demo-1",
        actorRole: "admin",
        action: "provider.credential.reviewed",
        resourceType: "ProviderProfile",
        createdAt: new Date().toISOString(),
      },
    ],
  });
}
