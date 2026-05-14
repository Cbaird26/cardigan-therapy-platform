import { apiError, ok } from "@/lib/api";
import { createCheckoutSession } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const checkout = checkoutSchema.parse(await request.json());
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
