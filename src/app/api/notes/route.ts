import { apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { createNote } from "@/lib/clinical-store";
import { providerSessionContextIfPresent } from "@/lib/provider-auth";
import { noteSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = providerSessionContextIfPresent(request) ?? getRequestContext(request);
    requireApiPermission(context, "note:create");
    const note = noteSchema.parse(await parseRequestData(request));
    const result = await createNote(note, context);

    return ok(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
