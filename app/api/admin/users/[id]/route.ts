import {
  AdminRequestError,
  adminApiError,
  assertUuid,
  readJsonObject,
} from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/server";
import { isAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const USER_ROLES = new Set(["customer", "provider"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id: rawId } = await context.params;
    const id = assertUuid(rawId);
    const body = await readJsonObject(request);
    const role = typeof body.role === "string" ? body.role : "";

    if (!USER_ROLES.has(role)) {
      throw new AdminRequestError(
        400,
        "Vai trò chỉ có thể là Khách hàng hoặc Nhà cung cấp."
      );
    }

    const admin = createAdminClient();
    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    if (targetError) throw new Error(targetError.message);
    if (!target) {
      throw new AdminRequestError(404, "Không tìm thấy tài khoản này.");
    }
    if (isAdminEmail(target.email)) {
      throw new AdminRequestError(
        409,
        "Không thể thay đổi vai trò của tài khoản quản trị chính."
      );
    }

    const { data, error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ user: { ...data, protected: false } });
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

    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    if (targetError) throw new Error(targetError.message);
    if (!target) {
      throw new AdminRequestError(404, "Không tìm thấy tài khoản này.");
    }
    if (isAdminEmail(target.email)) {
      throw new AdminRequestError(
        409,
        "Không thể xóa tài khoản quản trị chính."
      );
    }

    const { error } = await admin.auth.admin.deleteUser(id, false);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, deletedUserId: id });
  } catch (error) {
    return adminApiError(error);
  }
}
