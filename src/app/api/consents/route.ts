import { apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { signConsent } from "@/lib/clinical-store";
import { consentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "consent:sign");
    const consent = consentSchema.parse(await parseRequestData(request));
    const result = await signConsent(consent, context);

    return ok(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
