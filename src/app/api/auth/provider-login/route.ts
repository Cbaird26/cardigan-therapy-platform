import { NextResponse } from "next/server";
import { apiError, HttpError, ok, parseRequestData } from "@/lib/api";
import {
  createProviderSessionToken,
  providerSessionCookie,
  validateProviderCredentials,
} from "@/lib/provider-auth";

export async function POST(request: Request) {
  try {
    const body = await parseRequestData(request);
    const email = typeof body.email === "string" ? body.email : "";
    const passcode = typeof body.passcode === "string" ? body.passcode : "";

    if (!validateProviderCredentials({ email, passcode })) {
      throw new HttpError(401, "Invalid provider login.");
    }

    const response = ok({
      provider: {
        displayName: "Christopher Michael Baird",
        email: email.trim().toLowerCase(),
        role: "therapist",
      },
    });
    response.headers.set("Set-Cookie", providerSessionCookie(createProviderSessionToken()));

    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
