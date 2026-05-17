import { apiError, ok } from "@/lib/api";
import { pushNotionOs } from "@/lib/notion-os";
import { requireProviderSession } from "@/lib/provider-auth";

export async function POST(request: Request) {
  try {
    requireProviderSession(request);

    return ok(await pushNotionOs());
  } catch (error) {
    return apiError(error);
  }
}
