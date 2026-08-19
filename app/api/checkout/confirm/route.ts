import {
  getMembershipCheckoutDetails,
  getMembershipPlanAction,
  isBillingCycle,
  isPaidMembershipTier,
  MEMBERSHIP_TIERS,
  resolveMembership,
} from "@/lib/membership";
import { isAdminEmail } from "@/lib/auth";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/types/database";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const PAYMENT_METHODS: PaymentMethod[] = [
  "vietqr",
  "vnpay",
  "momo",
  "zalopay",
  "card",
];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return jsonError("Vui lòng đăng nhập trước khi xác nhận thanh toán.", 401);
  }

  const serverSecretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serverSecretKey || !supabaseUrl) {
    return jsonError("Máy chủ chưa được cấu hình để xác nhận giao dịch.", 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Dữ liệu giao dịch không hợp lệ.", 400);
  }

  const { kind, referenceId, orderCode, paymentMethod } = body;
  if (
    (kind !== "membership" && kind !== "rental" && kind !== "package") ||
    typeof orderCode !== "string" ||
    !/^LH-[A-Z0-9-]{6,32}$/.test(orderCode) ||
    !isPaymentMethod(paymentMethod)
  ) {
    return jsonError("Thông tin xác nhận giao dịch không hợp lệ.", 400);
  }

  const admin = createSupabaseAdmin(supabaseUrl, serverSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (kind === "membership") {
    const { membershipPlan, billingCycle } = body;
    if (
      !isPaidMembershipTier(membershipPlan) ||
      !isBillingCycle(billingCycle)
    ) {
      return jsonError("Gói thành viên không hợp lệ.", 400);
    }

    if (isAdminEmail(user.email)) {
      return jsonError(
        "Tài khoản quản trị đã có toàn quyền và không cần mua gói thành viên.",
        403
      );
    }

    const { data: currentProfile, error: currentProfileError } = await admin
      .from("profiles")
      .select("membership_tier,membership_status,trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfileError) {
      return jsonError(
        "Không thể xác định gói hiện tại. Vui lòng thử lại sau.",
        503
      );
    }

    const currentMembership = resolveMembership(
      currentProfile,
      user.app_metadata
    );
    const planAction = getMembershipPlanAction(
      currentMembership.membership_tier,
      currentMembership.membership_status,
      membershipPlan
    );

    if (planAction === "current") {
      return jsonError(
        `Bạn đang sử dụng ${MEMBERSHIP_TIERS[membershipPlan].label}. Chỉ có thể nâng cấp lên gói cao hơn.`,
        409
      );
    }

    if (planAction === "lower") {
      return jsonError(
        `Không thể chuyển từ ${MEMBERSHIP_TIERS[currentMembership.membership_tier].label} xuống ${MEMBERSHIP_TIERS[membershipPlan].label}.`,
        409
      );
    }

    const { title, amount } = getMembershipCheckoutDetails(
      membershipPlan,
      billingCycle
    );
    const purchasedAt = new Date().toISOString();

    // Auth app_metadata is server-controlled and keeps plan status available
    // even while an older database is waiting for the membership migration.
    const { error: authError } = await admin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          membership_tier: membershipPlan,
          membership_status: "active",
          membership_billing_cycle: billingCycle,
          membership_purchased_at: purchasedAt,
          trial_ends_at: null,
        },
      }
    );

    if (authError) {
      return jsonError(`Không thể kích hoạt gói: ${authError.message}`, 500);
    }

    const warnings: string[] = [];
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        membership_tier: membershipPlan,
        membership_status: "active",
        trial_ends_at: null,
      })
      .eq("id", user.id);

    if (profileError) warnings.push("profile-membership-migration-pending");

    const { error: transactionError } = await admin
      .from("transactions")
      .insert({
        order_code: orderCode,
        user_id: user.id,
        rental_id: null,
        membership_tier: membershipPlan,
        amount,
        payment_method: paymentMethod,
        payment_status: "completed",
        notes: `${planAction === "renew" ? "Gia hạn" : "Nâng cấp"} ${title} (${billingCycle})`,
      });

    if (transactionError) warnings.push("transaction-migration-pending");

    return NextResponse.json({
      ok: true,
      kind,
      title,
      amount,
      membershipTier: membershipPlan,
      membershipAction: planAction,
      warnings,
    });
  }

  if (typeof referenceId !== "string" || !referenceId) {
    return jsonError("Không tìm thấy mã đơn cần thanh toán.", 400);
  }

  if (kind === "rental") {
    const { data: rental, error: rentalError } = await admin
      .from("service_rentals")
      .select("id, customer_id, provider_id, total_price")
      .eq("id", referenceId)
      .maybeSingle();

    if (rentalError || !rental) {
      return jsonError("Không tìm thấy đơn thuê này.", 404);
    }
    if (rental.customer_id !== user.id && rental.provider_id !== user.id) {
      return jsonError("Bạn không có quyền thanh toán đơn thuê này.", 403);
    }

    const { error: updateError } = await admin
      .from("service_rentals")
      .update({ status: "in_progress" })
      .eq("id", rental.id);
    if (updateError) {
      return jsonError(
        `Không thể cập nhật đơn thuê: ${updateError.message}`,
        500
      );
    }

    const { error: transactionError } = await admin
      .from("transactions")
      .insert({
        order_code: orderCode,
        user_id: user.id,
        rental_id: rental.id,
        membership_tier: null,
        amount: Number(rental.total_price) || 0,
        payment_method: paymentMethod,
        payment_status: "completed",
        notes: "Thanh toán đơn thuê dịch vụ LiveHub",
      });

    return NextResponse.json({
      ok: true,
      kind,
      amount: Number(rental.total_price) || 0,
      warnings: transactionError ? ["transaction-migration-pending"] : [],
    });
  }

  const { data: booking, error: bookingError } = await admin
    .from("turnkey_package_bookings")
    .select("id, user_id, customer_email, package_name, estimated_price")
    .eq("id", referenceId)
    .maybeSingle();

  if (bookingError || !booking) {
    return jsonError(
      "Không tìm thấy đăng ký gói trọn gói. Vui lòng gửi lại yêu cầu tư vấn.",
      404
    );
  }
  if (
    (booking.user_id && booking.user_id !== user.id) ||
    (!booking.user_id &&
      booking.customer_email.toLowerCase() !== user.email?.toLowerCase())
  ) {
    return jsonError("Đăng ký gói này không thuộc tài khoản của bạn.", 403);
  }

  const { error: bookingUpdateError } = await admin
    .from("turnkey_package_bookings")
    .update({ status: "confirmed" })
    .eq("id", booking.id);
  if (bookingUpdateError) {
    return jsonError(
      `Không thể cập nhật lịch đặt: ${bookingUpdateError.message}`,
      500
    );
  }

  const { error: transactionError } = await admin.from("transactions").insert({
    order_code: orderCode,
    user_id: user.id,
    rental_id: null,
    package_booking_id: booking.id,
    membership_tier: null,
    amount: Number(booking.estimated_price) || 0,
    payment_method: paymentMethod,
    payment_status: "completed",
    notes: `Đặt cọc ${booking.package_name}`,
  });

  return NextResponse.json({
    ok: true,
    kind,
    amount: Number(booking.estimated_price) || 0,
    warnings: transactionError ? ["transaction-migration-pending"] : [],
  });
}
