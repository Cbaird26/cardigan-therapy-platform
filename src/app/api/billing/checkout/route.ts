import { HttpError, apiError, ok, parseRequestData } from "@/lib/api";
import { getRequestContext, requireApiPermission } from "@/lib/auth";
import { featureGateMessage, isFeatureEnabled } from "@/lib/features";
import { createCheckoutSession } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    requireApiPermission(context, "billing:checkout");

    if (!isFeatureEnabled("billing")) {
      throw new HttpError(403, featureGateMessage("billing"));
    }

    const checkout = checkoutSchema.parse(await parseRequestData(request));
    const session = await createCheckoutSession(checkout);

    return ok({
      ...session,
      compliance:
        "Stripe payload uses generic membership identifiers only. Do not send PHI in products, prices, descriptors, metadata, or webhook logs.",
    });
  } catch (error) {
    return apiError(error);
  }
}
