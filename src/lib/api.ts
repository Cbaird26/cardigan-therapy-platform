import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { redactForLogs } from "./compliance";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json(
    {
      error: "Request failed",
      detail: redactForLogs(message),
    },
    { status: 500 },
  );
}
