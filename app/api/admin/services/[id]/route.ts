import {
  AdminRequestError,
  adminApiError,
  assertUuid,
  readJsonObject,
} from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id: rawId } = await context.params;
    const id = assertUuid(rawId);
    const body = await readJsonObject(request);
    const status = typeof body.status === "string" ? body.status : "";

    if (status !== "approved" && status !== "rejected") {
      throw new AdminRequestError(400, "Trạng thái kiểm duyệt không hợp lệ.");
    }

    const rejectionReason =
      typeof body.rejectionReason === "string"
        ? body.rejectionReason.trim()
        : "";
    if (status === "rejected" && !rejectionReason) {
      throw new AdminRequestError(400, "Vui lòng nhập lý do từ chối.");
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("services")
      .update({
        status,
        rejection_reason: status === "rejected" ? rejectionReason : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, provider:profiles(*)")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new AdminRequestError(404, "Không tìm thấy dịch vụ này.");
    }

    return NextResponse.json({ service: data });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id: rawId } = await context.params;
    const id = assertUuid(rawId);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("services")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new AdminRequestError(404, "Không tìm thấy dịch vụ này.");
    }

    return NextResponse.json({ success: true, deletedServiceId: id });
  } catch (error) {
    return adminApiError(error);
  }
}
