import { apiError, ok } from "@/lib/api";
import { notionStatus } from "@/lib/notion-os";
import { requireProviderSession } from "@/lib/provider-auth";

export async function GET(request: Request) {
  try {
    requireProviderSession(request);

    return ok(notionStatus());
  } catch (error) {
    return apiError(error);
  }
}
