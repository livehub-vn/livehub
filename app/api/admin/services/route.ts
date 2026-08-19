import { AdminRequestError, adminApiError } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FILTERS = new Set(["pending", "approved", "rejected", "closed", "all"]);

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const status = new URL(request.url).searchParams.get("status") ?? "pending";
    if (!FILTERS.has(status)) {
      throw new AdminRequestError(400, "Bộ lọc trạng thái không hợp lệ.");
    }

    const admin = createAdminClient();
    let query = admin
      .from("services")
      .select("*, provider:profiles(*)")
      .order("created_at", { ascending: false });

    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ services: data ?? [] });
  } catch (error) {
    return adminApiError(error);
  }
}
