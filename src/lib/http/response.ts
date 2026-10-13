import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function jsonResponse<T>(data: T, status = 200, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, { status, ...init });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues?.[0] || (error as unknown as { errors?: Array<{ message: string }> }).errors?.[0];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message || "Validation failed",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        error: {
          code: "MALFORMED_JSON",
          message: "Request body contains malformed JSON",
        },
      },
      { status: 400 }
    );
  }

  // Fallback 500 without leaking sensitive internals or stack traces
  console.error("Unhandled server error:", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred",
      },
    },
    { status: 500 }
  );
}
