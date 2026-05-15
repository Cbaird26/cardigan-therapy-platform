import { apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { createMessage } from "@/lib/clinical-store";
import { messageSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "message:create");
    const message = messageSchema.parse(await parseRequestData(request));
    const result = await createMessage(message, context);

    return ok(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
