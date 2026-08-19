import {
  AdminRequestError,
  adminApiError,
  assertUuid,
  readJsonObject,
} from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/server";
import { SEED_DEMANDS } from "@/lib/mock-data";
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
      .from("demands")
      .select("*, customer:profiles(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      const fallback = SEED_DEMANDS.find((d) => d.id === id);
      if (fallback) {
        return NextResponse.json({ demand: fallback });
      }
      throw new AdminRequestError(404, "Không tìm thấy nhu cầu này.");
    }

    return NextResponse.json({ demand: data });
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
    if (typeof body.budget === "number" && !isNaN(body.budget)) {
      updatePayload.budget = body.budget;
    } else if (typeof body.budget === "string" && !isNaN(Number(body.budget))) {
      updatePayload.budget = Number(body.budget);
    }
    if (typeof body.location === "string") {
      updatePayload.location = body.location.trim();
    }
    if (typeof body.event_date === "string") {
      updatePayload.event_date = body.event_date.trim();
    }
    if (Array.isArray(body.images)) {
      updatePayload.images = body.images;
    }
    if (body.requirements && typeof body.requirements === "object") {
      updatePayload.requirements = body.requirements;
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
      .from("demands")
      .update(updatePayload)
      .eq("id", id)
      .select("*, customer:profiles(*)")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new AdminRequestError(404, "Không tìm thấy nhu cầu này.");
    }

    return NextResponse.json({ demand: data });
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
      .from("demands")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new AdminRequestError(404, "Không tìm thấy nhu cầu này.");
    }

    return NextResponse.json({ success: true, deletedDemandId: id });
  } catch (error) {
    return adminApiError(error);
  }
}
