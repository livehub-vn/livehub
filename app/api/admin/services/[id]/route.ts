import {
  AdminRequestError,
  adminApiError,
  assertUuid,
  readJsonObject,
} from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/server";
import { SEED_SERVICES } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id: rawId } = await context.params;
    const id = assertUuid(rawId);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("services")
      .select("*, provider:profiles(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      const fallback = SEED_SERVICES.find((s) => s.id === id);
      if (fallback) {
        return NextResponse.json({ service: fallback });
      }
      throw new AdminRequestError(404, "Không tìm thấy dịch vụ này.");
    }

    return NextResponse.json({ service: data });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id: rawId } = await context.params;
    const id = assertUuid(rawId);
    const body = await readJsonObject(request);

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string" && body.title.trim()) {
      updatePayload.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      updatePayload.description = body.description.trim();
    }
    if (typeof body.category === "string" && body.category.trim()) {
      updatePayload.category = body.category.trim();
    }
    if (typeof body.price_per_day === "number" && !isNaN(body.price_per_day)) {
      updatePayload.price_per_day = body.price_per_day;
    } else if (typeof body.price_per_day === "string" && !isNaN(Number(body.price_per_day))) {
      updatePayload.price_per_day = Number(body.price_per_day);
    }
    if (typeof body.location === "string") {
      updatePayload.location = body.location.trim();
    }
    if (Array.isArray(body.images)) {
      updatePayload.images = body.images;
    }
    if (body.specs && typeof body.specs === "object") {
      updatePayload.specs = body.specs;
    }

    if (typeof body.status === "string" && body.status.trim()) {
      const status = body.status.trim();
      const validStatuses = [
        "pending",
        "approved",
        "rejected",
        "in_progress",
        "completed",
        "closed",
      ];
      if (!validStatuses.includes(status)) {
        throw new AdminRequestError(400, "Trạng thái kiểm duyệt không hợp lệ.");
      }
      updatePayload.status = status;

      const rejectionReason =
        typeof body.rejectionReason === "string"
          ? body.rejectionReason.trim()
          : typeof body.rejection_reason === "string"
            ? body.rejection_reason.trim()
            : "";

      if (status === "rejected") {
        if (!rejectionReason) {
          throw new AdminRequestError(400, "Vui lòng nhập lý do từ chối.");
        }
        updatePayload.rejection_reason = rejectionReason;
      } else if (status === "approved") {
        updatePayload.rejection_reason = null;
      }
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("services")
      .update(updatePayload)
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
