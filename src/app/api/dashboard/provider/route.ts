import { apiError, ok } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { getProviderDashboardSnapshot } from "@/lib/clinical-store";

export async function GET(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "client:read-assigned");
    const snapshot = await getProviderDashboardSnapshot();

    return ok({
      ...snapshot,
      scope: "provider-assigned-clients",
    });
  } catch (error) {
    return apiError(error);
  }
}
