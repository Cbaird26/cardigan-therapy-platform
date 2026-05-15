import { apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { requestProviderSwitch } from "@/lib/clinical-store";
import { providerSwitchSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "provider-switch:create");
    const switchRequest = providerSwitchSchema.parse(await parseRequestData(request));
    const result = await requestProviderSwitch(switchRequest, context);

    return ok(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
