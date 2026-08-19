import "server-only";

import { isAdminEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export class AdminAccessError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
  }
}

/**
 * Verifies the current cookie-backed Supabase user with the Auth server and
 * authorizes only the configured LiveHub owner email. Database profile roles
 * and user-editable metadata are deliberately not trusted here.
 */
export async function requireAdminUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminAccessError(401, "Bạn cần đăng nhập để tiếp tục.");
  }

  if (!isAdminEmail(user.email)) {
    throw new AdminAccessError(
      403,
      "Tài khoản này không có quyền truy cập khu vực quản trị."
    );
  }

  return user;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Đã xảy ra lỗi không xác định.";
}
