import { apiError, ok } from "@/lib/api";
import { computeMatchCandidates } from "@/lib/matching";
import { providers } from "@/lib/mock-data";
import { intakeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const intake = intakeSchema.parse(await request.json());

    return ok({
      candidates: computeMatchCandidates(intake, providers),
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
