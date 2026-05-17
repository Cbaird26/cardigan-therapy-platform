import { apiError, ok } from "@/lib/api";
import { bootstrapNotionOs } from "@/lib/notion-os";
import { requireProviderSession } from "@/lib/provider-auth";

export async function POST(request: Request) {
  try {
    requireProviderSession(request);

    return ok(await bootstrapNotionOs());
  } catch (error) {
    return apiError(error);
  }
}
