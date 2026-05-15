import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { redactForLogs } from "./compliance";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function parseRequestData(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    const data: Record<string, unknown> = {};

    for (const [key, value] of form.entries()) {
      const normalized = typeof value === "string" ? value : value.name;
      const current = data[key];

      if (Array.isArray(current)) {
        current.push(normalized);
      } else if (current !== undefined) {
        data[key] = [current, normalized];
      } else {
        data[key] = normalized;
      }
    }

    return data;
  }

  return request.json();
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

  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: error.status },
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
