import { apiError, ok, parseRequestData } from "@/lib/api";
import { getLaunchProviders } from "@/lib/clinical-store";
import { computeMatchCandidates } from "@/lib/matching";
import { intakeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const intake = intakeSchema.parse(await parseRequestData(request));

    return ok({
      candidates: computeMatchCandidates(intake, getLaunchProviders()),
      rules: [
        "Florida client location required for pilot",
        "Provider must hold an active Florida license",
        "Minor clients only match to providers accepting children/teens",
        "Admin can override after credential and fit review",
      ],
    });
  } catch (error) {
    return apiError(error);
  }
}
