import { apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { submitOnboarding } from "@/lib/clinical-store";
import { onboardingSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "intake:create");
    const intake = onboardingSchema.parse(await parseRequestData(request));
    const result = await submitOnboarding(intake, context);

    return ok(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
