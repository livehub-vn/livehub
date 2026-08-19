import { adminApiError } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/server";
import { isAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminUser();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      users: (data ?? []).map((profile) => ({
        ...profile,
        ...(isAdminEmail(profile.email) ? { role: "admin" } : {}),
        protected: isAdminEmail(profile.email),
      })),
    });
  } catch (error) {
    return adminApiError(error);
  }
}
