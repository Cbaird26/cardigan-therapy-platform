import { apiError, ok } from "@/lib/api";
import { pullNotionOs } from "@/lib/notion-os";
import { requireProviderSession } from "@/lib/provider-auth";

export async function POST(request: Request) {
  try {
    requireProviderSession(request);

    return ok(await pullNotionOs());
  } catch (error) {
    return apiError(error);
  }
}
