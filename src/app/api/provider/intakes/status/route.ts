import { apiError, ok, parseRequestData } from "@/lib/api";
import { updateIntakeReviewStatus } from "@/lib/clinical-store";
import { providerSessionContext } from "@/lib/provider-auth";
import { providerIntakeStatusSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = providerSessionContext(request);
    const input = providerIntakeStatusSchema.parse(await parseRequestData(request));
    const result = await updateIntakeReviewStatus(input, context);

    return ok(result);
  } catch (error) {
    return apiError(error);
  }
}
