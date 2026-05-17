import { ok } from "@/lib/api";
import { clearProviderSessionCookie } from "@/lib/provider-auth";

export async function POST() {
  const response = ok({ status: "logged-out" });
  response.headers.set("Set-Cookie", clearProviderSessionCookie());

  return response;
}
