import { apiError, ok } from "@/lib/api";
import { getProviderDashboardSnapshot } from "@/lib/clinical-store";
import { providerSessionContext } from "@/lib/provider-auth";

export async function GET(request: Request) {
  try {
    providerSessionContext(request);
    const snapshot = await getProviderDashboardSnapshot();

    return ok({
      ...snapshot,
      scope: "provider-assigned-clients",
    });
  } catch (error) {
    return apiError(error);
  }
}
