import "server-only";

import { AdminAccessError, getErrorMessage } from "@/lib/admin/server";
import { AdminConfigurationError } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export class AdminRequestError extends Error {
  readonly status: 400 | 404 | 409;

  constructor(status: 400 | 404 | 409, message: string) {
    super(message);
    this.name = "AdminRequestError";
    this.status = status;
  }
}

export function adminApiError(error: unknown): NextResponse {
  if (error instanceof AdminAccessError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }

  if (error instanceof AdminConfigurationError) {
    return NextResponse.json(
      { error: error.message, code: "ADMIN_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  if (error instanceof AdminRequestError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }

  return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
}

export function assertUuid(value: string): string {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
    throw new AdminRequestError(400, "Mã bản ghi không hợp lệ.");
  }

  return value;
}

export async function readJsonObject(
  request: Request
): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new AdminRequestError(400, "Dữ liệu gửi lên không hợp lệ.");
    }
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AdminRequestError(400, "Dữ liệu JSON không hợp lệ.");
    }
    throw error;
  }
}
