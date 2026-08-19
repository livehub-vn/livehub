import "server-only";

import { createClient } from "@supabase/supabase-js";

export class AdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigurationError";
  }
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverSecretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serverSecretKey) {
    throw new AdminConfigurationError(
      "Máy chủ chưa cấu hình Supabase Secret Key cho khu vực quản trị."
    );
  }

  return createClient(supabaseUrl, serverSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
