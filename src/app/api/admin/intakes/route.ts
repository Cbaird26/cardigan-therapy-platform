import { apiError, ok } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { getAdminIntakeSnapshot } from "@/lib/clinical-store";

export async function GET(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "intake:read");
    const snapshot = await getAdminIntakeSnapshot();

    return ok({
      ...snapshot,
      scope: "admin-intake-review",
    });
  } catch (error) {
    return apiError(error);
  }
}
