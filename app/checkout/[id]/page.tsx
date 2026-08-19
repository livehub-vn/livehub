"use client";

import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth";
import {
  getMembershipCheckoutDetails,
  getMembershipPlanAction,
  isBillingCycle,
  isPaidMembershipTier,
  MEMBERSHIP_TIERS,
  resolveMembership,
} from "@/lib/membership";
import { getFallbackProfile } from "@/lib/demo-session";
import type {
  PaymentMethod,
  PaymentStatus,
  ServiceRental,
} from "@/lib/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Lock,
  Printer,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkoutId = (params?.id as string) || "rental";
  const isMembership = checkoutId.startsWith("membership_");
  const isPackage = checkoutId.startsWith("package_");
  const membershipPlanValue = isMembership
    ? checkoutId.replace("membership_", "")
    : null;
  const membershipPlan = isPaidMembershipTier(membershipPlanValue)
    ? membershipPlanValue
    : null;
  const billingCycleValue = searchParams.get("cycle");
  const billingCycle = isBillingCycle(billingCycleValue)
    ? billingCycleValue
    : "monthly";
  const bookingId = searchParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [rental, setRental] = useState<ServiceRental | null>(null);

  // Order meta
  const [orderCode] = useState(
    () => `LH-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [orderTitle, setOrderTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  // Payment settings
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vietqr");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("pending_payment");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(900); // 15 mins
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);

  // LiveHub representative bank details
  const BANK_INFO = {
    bankName: "VietinBank (Ngân hàng TMCP Công Thương VN)",
    bankCode: "ICB",
    bin: "970415",
    accountNumber: "103876543210",
    accountHolder: "CONG TY CONG NGHE LIVEHUB VIET NAM",
  };

  useEffect(() => {
    const supabase = createClient();

    async function loadOrderData() {
      setLoading(true);
      setOrderLoadError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const activeUser = user || {
        id: getFallbackProfile("customer").id,
        email: getFallbackProfile("customer").email,
        app_metadata: {},
        user_metadata: {},
      };

      if (isMembership) {
        if (!membershipPlan) {
          setOrderLoadError("Gói thành viên không hợp lệ.");
          setLoading(false);
          return;
        }

        if (isAdminEmail(activeUser.email)) {
          setOrderLoadError(
            "Tài khoản quản trị đã có toàn quyền và không cần mua gói thành viên."
          );
          setLoading(false);
          return;
        }

        const { data: currentProfile, error: currentProfileError } =
          await supabase
            .from("profiles")
            .select("membership_tier,membership_status,trial_ends_at")
            .eq("id", activeUser.id)
            .maybeSingle();

        if (currentProfileError) {
          setOrderLoadError(
            "Không thể xác định gói hiện tại. Vui lòng quay lại Bảng giá và thử lại."
          );
          setLoading(false);
          return;
        }

        const currentMembership = resolveMembership(
          currentProfile,
          activeUser.app_metadata
        );
        const planAction = getMembershipPlanAction(
          currentMembership.membership_tier,
          currentMembership.membership_status,
          membershipPlan
        );

        if (planAction === "current") {
          setOrderLoadError(
            `Bạn đang sử dụng ${MEMBERSHIP_TIERS[membershipPlan].label}. Chỉ có thể nâng cấp lên gói cao hơn.`
          );
          setLoading(false);
          return;
        }

        if (planAction === "lower") {
          setOrderLoadError(
            `Không thể chuyển từ ${MEMBERSHIP_TIERS[currentMembership.membership_tier].label} xuống ${MEMBERSHIP_TIERS[membershipPlan].label}.`
          );
          setLoading(false);
          return;
        }

        const details = getMembershipCheckoutDetails(
          membershipPlan,
          billingCycle
        );
        setTotalAmount(details.amount);
        setOrderTitle(
          `${planAction === "renew" ? "Gia hạn" : "Nâng cấp"} ${details.title}`
        );
        setLoading(false);
      } else if (isPackage) {
        if (!bookingId) {
          setOrderLoadError(
            "Thiếu mã đăng ký gói trọn gói. Vui lòng quay lại và gửi yêu cầu tư vấn."
          );
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/bookings?id=${encodeURIComponent(bookingId)}`
        );
        const data = (await response.json()) as {
          error?: string;
          packageName?: string;
          estimatedPrice?: number;
        };

        if (!response.ok || !data.packageName) {
          setOrderLoadError(
            data.error ||
              "Không tìm thấy đăng ký gói trọn gói. Vui lòng quay lại và gửi lại yêu cầu."
          );
        } else {
          setTotalAmount(Number(data.estimatedPrice) || 0);
          setOrderTitle(data.packageName);
        }
        setLoading(false);
      } else {
        // Rental Checkout from Database
        try {
          const rentalId = checkoutId.replace("rental_", "");
          const { data, error } = await supabase
            .from("service_rentals")
            .select(
              "*, service:services!service_rentals_service_id_fkey(*), customer:profiles!service_rentals_customer_id_fkey(*), provider:profiles!service_rentals_provider_id_fkey(*)"
            )
            .eq("id", rentalId)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            const rentalData = data as ServiceRental;
            setRental(rentalData);
            setTotalAmount(rentalData.total_price || 2500000);
            setOrderTitle(
              rentalData.service?.title ||
                "Dịch vụ thuê thiết bị / Ekip LiveHub"
            );
          } else {
            setOrderLoadError("Không tìm thấy đơn thuê cần thanh toán.");
          }
        } catch (error: unknown) {
          setOrderLoadError(
            (error as Error).message || "Không thể tải thông tin đơn hàng."
          );
        } finally {
          setLoading(false);
        }
      }
    }

    loadOrderData();
  }, [
    billingCycle,
    bookingId,
    checkoutId,
    isMembership,
    isPackage,
    membershipPlan,
    router,
  ]);

  // 15-minute countdown timer
  useEffect(() => {
    if (paymentStatus === "completed") return;

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentStatus]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Real Dynamic VietQR API URL
  const transferContent = `LIVEHUB ${orderCode}`;
  const vietQrUrl = `https://api.vietqr.io/image/${BANK_INFO.bin}-${BANK_INFO.accountNumber}-compact2.jpg?amount=${totalAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(BANK_INFO.accountHolder)}`;

  const handleConfirmPayment = async () => {
    setIsVerifying(true);
    setPaymentStatus("processing");
    setPaymentError(null);

    try {
      const kind = isMembership
        ? "membership"
        : isPackage
          ? "package"
          : "rental";
      const referenceId = isPackage
        ? bookingId
        : (rental?.id ?? checkoutId.replace("rental_", ""));
      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          referenceId,
          membershipPlan,
          billingCycle,
          orderCode,
          paymentMethod,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        amount?: number;
      };

      if (!response.ok) {
        throw new Error(result.error || "Không thể xác nhận giao dịch.");
      }

      if (typeof result.amount === "number") setTotalAmount(result.amount);

      if (isMembership) {
        const supabase = createClient();
        await supabase.auth.refreshSession();
        window.dispatchEvent(new Event("livehub:profile-updated"));
      }

      setIsVerifying(false);
      setPaymentStatus("completed");
    } catch (error: unknown) {
      setPaymentError(
        (error as Error).message || "Không thể xác nhận giao dịch."
      );
      setIsVerifying(false);
      setPaymentStatus("failed");
    }
  };

  if (loading) {
    return (
      <div className="bg-background text-foreground min-h-screen px-6 pt-28 pb-14 sm:pt-32">
        <div className="mx-auto max-w-4xl space-y-8">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-48 w-full rounded-[2.5rem]" />
              <Skeleton className="h-96 w-full rounded-[2.5rem]" />
            </div>
            <Skeleton className="h-80 w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (orderLoadError) {
    return (
      <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
        <div className="mx-auto w-full max-w-6xl">
          <div className="bg-card mx-auto max-w-xl rounded-[2.5rem] border border-rose-500/20 p-8 text-center shadow-xl sm:p-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <Lock className="size-6" />
            </div>
            <h1 className="mt-5 text-xl font-bold">Không thể mở thanh toán</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {orderLoadError}
            </p>
            <Link
              href={
                isMembership ? "/pricing" : isPackage ? "/packages" : "/rentals"
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-bold text-white hover:bg-orange-600"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        {/* Back link */}
        <Link
          href={
            isMembership ? "/pricing" : isPackage ? "/packages" : "/services"
          }
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>
            {isMembership
              ? "Quay lại Bảng giá"
              : isPackage
                ? "Quay lại Dịch vụ trọn gói"
                : "Quay lại Sàn dịch vụ"}
          </span>
        </Link>

        {paymentError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm font-medium text-rose-600 dark:text-rose-300"
          >
            {paymentError}
          </div>
        )}

        {/* COMPLETED RECEIPT SCREEN */}
        {paymentStatus === "completed" ? (
          <div className="bg-card animate-in zoom-in-95 mx-auto max-w-2xl rounded-[2.5rem] border border-emerald-500/30 p-8 shadow-2xl sm:p-12">
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-9" />
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                Giao dịch thành công
              </span>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl dark:text-emerald-200">
                Thanh toán hoàn tất!
              </h1>

              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Hệ thống LiveHub đã ghi nhận khoản thanh toán và xuất hóa đơn
                điện tử cho giao dịch của bạn.
              </p>
            </div>

            {/* Electronic Receipt Summary Box */}
            <div className="border-border bg-muted/50 mt-8 space-y-3.5 rounded-2xl border p-6 text-xs">
              <div className="border-border/60 flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <strong className="text-foreground font-mono text-sm font-bold">
                  {orderCode}
                </strong>
              </div>

              <div className="border-border/60 flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground">
                  Hạng mục thanh toán
                </span>
                <span className="max-w-xs truncate text-right font-semibold">
                  {orderTitle}
                </span>
              </div>

              <div className="border-border/60 flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground">
                  Phương thức thanh toán
                </span>
                <span className="font-semibold capitalize">
                  {paymentMethod === "vietqr"
                    ? "QR Banking (VietQR)"
                    : paymentMethod.toUpperCase()}
                </span>
              </div>

              <div className="border-border/60 flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground">
                  Thời gian ghi nhận
                </span>
                <span className="text-muted-foreground font-medium">
                  {new Date().toLocaleString("vi-VN")}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 text-sm font-bold">
                <span>Tổng tiền đã thanh toán</span>
                <span className="text-lg text-emerald-600 dark:text-emerald-400">
                  {totalAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="border-border bg-background hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-colors"
              >
                <Printer className="size-3.5" />
                <span>In biên lai hóa đơn</span>
              </button>

              <Link
                href={
                  isMembership
                    ? "/profile"
                    : isPackage
                      ? "/packages"
                      : "/rentals"
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600"
              >
                <span>
                  {isMembership
                    ? "Xem hồ sơ & gói của tôi"
                    : isPackage
                      ? "Xem các gói dịch vụ"
                      : "Xem hợp đồng & đơn thuê"}
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* MAIN CHECKOUT SCREEN */
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 cols: Payment Method & VietQR Display */}
            <div className="space-y-6 lg:col-span-2">
              {/* Payment Method Selector Tabs */}
              <div className="border-border bg-card rounded-[2.5rem] border p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold">
                  Chọn phương thức thanh toán
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Chọn kênh chuyển tiền bảo đảm qua hệ sinh thái LiveHub.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("vietqr")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-all ${
                      paymentMethod === "vietqr"
                        ? "border-orange-500 bg-orange-500/10 text-orange-500 ring-2 ring-orange-500/20"
                        : "border-border bg-background hover:border-orange-500/40"
                    }`}
                  >
                    <QrCode className="size-5" />
                    <span>VietQR (Khuyên dùng)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("vnpay")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-all ${
                      paymentMethod === "vnpay"
                        ? "border-orange-500 bg-orange-500/10 text-orange-500 ring-2 ring-orange-500/20"
                        : "border-border bg-background hover:border-orange-500/40"
                    }`}
                  >
                    <Wallet className="size-5" />
                    <span>VNPay QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("momo")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-all ${
                      paymentMethod === "momo"
                        ? "border-orange-500 bg-orange-500/10 text-orange-500 ring-2 ring-orange-500/20"
                        : "border-border bg-background hover:border-orange-500/40"
                    }`}
                  >
                    <Wallet className="size-5" />
                    <span>Ví MoMo / ZaloPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-all ${
                      paymentMethod === "card"
                        ? "border-orange-500 bg-orange-500/10 text-orange-500 ring-2 ring-orange-500/20"
                        : "border-border bg-background hover:border-orange-500/40"
                    }`}
                  >
                    <CreditCard className="size-5" />
                    <span>Thẻ Visa / Master</span>
                  </button>
                </div>
              </div>

              {/* REAL VIETQR DISPLAY BOX */}
              {paymentMethod === "vietqr" ? (
                <div className="bg-card rounded-[2.5rem] border border-orange-500/30 p-6 shadow-xl sm:p-8">
                  <div className="border-border flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-0.5 text-[11px] font-bold text-orange-500">
                        <QrCode className="size-3.5" />
                        Quét mã VietQR chuyển khoản nhanh 24/7
                      </span>
                      <h3 className="mt-2 text-xl font-bold">
                        Mã QR Thanh Toán Tự Động
                      </h3>
                    </div>

                    <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold">
                      <Clock className="size-4 text-orange-500" />
                      <span>Hết hạn sau: </span>
                      <strong className="font-mono text-sm text-orange-500">
                        {formatCountdown(countdownSeconds)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-6 grid items-center gap-6 md:grid-cols-2">
                    {/* QR Code Image */}
                    <div className="border-border flex flex-col items-center justify-center rounded-3xl border bg-white p-6 text-center shadow-inner">
                      <div className="relative size-56 overflow-hidden rounded-2xl">
                        <Image
                          src={vietQrUrl}
                          alt="Mã VietQR thanh toán LiveHub"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <p className="mt-3 text-[11px] font-semibold text-neutral-600">
                        Mở app Ngân hàng bất kỳ để quét mã
                      </p>
                    </div>

                    {/* Bank Info Details & Copy Buttons */}
                    <div className="space-y-3 text-xs">
                      <div className="border-border bg-muted/40 rounded-2xl border p-3.5">
                        <span className="text-muted-foreground text-[10px]">
                          Ngân hàng thụ hưởng
                        </span>
                        <p className="text-foreground mt-0.5 font-bold">
                          {BANK_INFO.bankName}
                        </p>
                      </div>

                      <div className="border-border bg-muted/40 flex items-center justify-between rounded-2xl border p-3.5">
                        <div>
                          <span className="text-muted-foreground text-[10px]">
                            Số tài khoản
                          </span>
                          <p className="text-foreground mt-0.5 font-mono text-sm font-extrabold">
                            {BANK_INFO.accountNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(BANK_INFO.accountNumber, "account")
                          }
                          className="bg-background border-border text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold"
                        >
                          {copiedField === "account" ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          <span>
                            {copiedField === "account" ? "Đã chép" : "Sao chép"}
                          </span>
                        </button>
                      </div>

                      <div className="border-border bg-muted/40 flex items-center justify-between rounded-2xl border p-3.5">
                        <div>
                          <span className="text-muted-foreground text-[10px]">
                            Số tiền chính xác
                          </span>
                          <p className="mt-0.5 text-sm font-bold text-orange-500">
                            {totalAmount.toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(totalAmount.toString(), "amount")
                          }
                          className="bg-background border-border text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold"
                        >
                          {copiedField === "amount" ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          <span>
                            {copiedField === "amount" ? "Đã chép" : "Sao chép"}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-orange-500/30 bg-orange-500/5 p-3.5">
                        <div>
                          <span className="text-[10px] font-bold text-orange-500">
                            Nội dung chuyển khoản (bắt buộc)
                          </span>
                          <p className="mt-0.5 font-mono text-sm font-extrabold text-orange-600 dark:text-orange-400">
                            {transferContent}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(transferContent, "memo")}
                          className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-2.5 py-1.5 font-bold text-white shadow-sm hover:bg-orange-600"
                        >
                          {copiedField === "memo" ? (
                            <Check className="size-3" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          <span>
                            {copiedField === "memo" ? "Đã chép" : "Sao chép"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manual Confirmation CTA */}
                  <div className="border-border mt-8 space-y-3 border-t pt-6 text-center">
                    <p className="text-muted-foreground text-xs">
                      Sau khi chuyển khoản trên ứng dụng ngân hàng, nhấn nút bên
                      dưới để xác nhận hoàn tất:
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isVerifying}
                      className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-orange-500 px-8 py-3.5 text-xs font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.01] hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50 sm:w-auto"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>
                        {isVerifying
                          ? "Đang kiểm tra giao dịch..."
                          : "Tôi đã chuyển khoản thành công"}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* OTHER PAYMENT METHODS SIMULATION */
                <div className="border-border bg-card space-y-4 rounded-[2.5rem] border p-8 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                    <Lock className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold">
                    Cổng thanh toán {paymentMethod.toUpperCase()}
                  </h3>
                  <p className="text-muted-foreground mx-auto max-w-md text-xs">
                    Bạn sẽ được chuyển hướng an toàn tới cổng thanh toán đối tác
                    để hoàn tất giao dịch.
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isVerifying}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600"
                  >
                    <span>
                      {isVerifying
                        ? "Đang kết nối..."
                        : `Tiếp tục thanh toán qua ${paymentMethod.toUpperCase()}`}
                    </span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right 1 col: Order Summary */}
            <div className="lg:col-span-1">
              <div className="border-border bg-card sticky top-28 space-y-6 rounded-[2.5rem] border p-6 shadow-xl sm:p-8">
                <div className="border-border border-b pb-4">
                  <span className="text-muted-foreground text-[11px] font-semibold">
                    Tóm tắt đơn hàng
                  </span>
                  <h3 className="mt-1 text-base leading-snug font-bold">
                    {orderTitle}
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="text-muted-foreground flex items-center justify-between">
                    <span>Mã đơn</span>
                    <strong className="text-foreground font-mono">
                      {orderCode}
                    </strong>
                  </div>

                  <div className="text-muted-foreground flex items-center justify-between">
                    <span>Tạm tính</span>
                    <span className="text-foreground">
                      {totalAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  <div className="text-muted-foreground flex items-center justify-between">
                    <span>Phí bảo đảm sàn</span>
                    <span className="font-semibold text-emerald-500">
                      Miễn phí 0đ
                    </span>
                  </div>

                  <div className="text-muted-foreground flex items-center justify-between">
                    <span>Thuế VAT (8%)</span>
                    <span className="text-foreground">Đã bao gồm</span>
                  </div>

                  <div className="border-border flex items-baseline justify-between border-t pt-4 text-sm font-bold">
                    <span>Tổng thanh toán</span>
                    <span className="text-xl font-extrabold text-orange-500">
                      {totalAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                <div className="border-border bg-muted/40 text-muted-foreground space-y-2 rounded-2xl border p-4 text-[11px]">
                  <div className="text-foreground flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="size-4 text-orange-500" />
                    <span>Bảo vệ quyền lợi 100%</span>
                  </div>
                  <p className="leading-relaxed">
                    LiveHub giữ tiền đặt cọc an toàn và chỉ tất toán cho bên
                    cung cấp sau khi dịch vụ được hoàn thành như cam kết.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
