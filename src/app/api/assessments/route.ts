import { apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { createAssessment } from "@/lib/clinical-store";
import { assessmentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "assessment:create");
    const assessment = assessmentSchema.parse(await parseRequestData(request));
    const result = await createAssessment(assessment, context);

    return ok(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
