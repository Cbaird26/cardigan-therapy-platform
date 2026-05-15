import { apiError, ok } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { getClientDashboardSnapshot } from "@/lib/clinical-store";

export async function GET(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "client:read-self");
    const clientId = request.headers.get("x-cardigan-client-id") ?? undefined;
    const snapshot = await getClientDashboardSnapshot(clientId);

    return ok({
      ...snapshot,
      scope: "client-self",
    });
  } catch (error) {
    return apiError(error);
  }
}
