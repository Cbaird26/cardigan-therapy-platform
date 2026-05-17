import { apiError, ok } from "@/lib/api";
import { getProviderPracticeSnapshot } from "@/lib/clinical-store";
import { requireProviderSession } from "@/lib/provider-auth";

export async function GET(request: Request) {
  try {
    const session = requireProviderSession(request);
    const snapshot = await getProviderPracticeSnapshot();

    return ok({
      ...snapshot,
      authenticatedProvider: {
        displayName: session.displayName,
        email: session.email,
        providerId: session.providerId,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
