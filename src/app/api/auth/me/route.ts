import { ok } from "@/lib/api";
import { providerSessionFromRequest } from "@/lib/provider-auth";

export async function GET(request: Request) {
  const provider = providerSessionFromRequest(request);

  return ok({
    authenticated: Boolean(provider),
    provider,
  });
}
