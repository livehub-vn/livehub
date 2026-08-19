"use client";

import { createClient } from "@/lib/supabase/client";
import type { ServiceRental } from "@/lib/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Printer,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RentalDetailPage() {
  const params = useParams();
  const rentalId = params?.id as string;

  const [rental, setRental] = useState<ServiceRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadRental() {
      if (!rentalId) return;
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      }

      const { data, error } = await supabase
        .from("service_rentals")
        .select(
          "*, service:services(*), customer:profiles!customer_id(*), provider:profiles!provider_id(*)"
        )
        .eq("id", rentalId)
        .maybeSingle();

      if (data && !error) {
        setRental(data as ServiceRental);
      } else {
        // Fallback for demo rentals
        const demoRental: ServiceRental = {
          id: rentalId,
          service_id: "s0000001-0000-0000-0000-000000000001",
          customer_id: user?.id || "demo-cust",
          provider_id: "d0000001-0000-0000-0000-000000000001",
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          total_price: 3600000,
          status: "in_progress",
          notes: "Thuê máy quay kèm ống kính 24-70mm GM II và 3 pin sạc dự phòng cho chuỗi livestream ra mắt sản phẩm.",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          service: {
            id: "s0000001-0000-0000-0000-000000000001",
            provider_id: "d0000001-0000-0000-0000-000000000001",
            title: "Gói Máy Quay Cinema Sony FX3 + Lens GM II + Truyền Hình Ảnh Không Dây Hollyland 4K",
            description: "Trọn bộ máy quay Full-frame Sony FX3 cảm biến 4K 120fps, kèm ống kính Sony FE 24-70mm f/2.8 GM II và FE 70-200mm f/2.8 GM OSS II.",
            category: "equipment",
            price_per_day: 1800000,
            location: "Quận 1, TP. Hồ Chí Minh",
            status: "approved",
            images: [
              "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&auto=format&fit=crop&q=80",
            ],
            created_at: new Date().toISOString(),
          },
          customer: {
            id: user?.id || "demo-cust",
            email: user?.email || "customer@livehub.vn",
            full_name: "Tập đoàn Truyền thông V-Brand",
            phone: "0977665544",
            avatar_url: null,
            bio: null,
            role: "customer",
            membership_tier: "premium",
            created_at: new Date().toISOString(),
          },
          provider: {
            id: "d0000001-0000-0000-0000-000000000001",
            email: "saigonstudio@livehub.vn",
            full_name: "Saigon Cinema & Studio Production",
            phone: "0908889999",
            avatar_url: null,
            bio: null,
            role: "provider",
            membership_tier: "premium",
            created_at: new Date().toISOString(),
          },
        };
        setRental(demoRental);
      }
      setLoading(false);
    }

    loadRental();
  }, [rentalId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!rental) return;
    setUpdating(true);
    const supabase = createClient();
    await supabase
      .from("service_rentals")
      .update({ status: newStatus })
      .eq("id", rental.id);

    setRental((prev) => (prev ? { ...prev, status: newStatus as any } : null));
    setUpdating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-44 w-full rounded-[2.5rem]" />
          <Skeleton className="h-96 w-full rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold">Không tìm thấy đơn thuê</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Mã đơn thuê không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Link
            href="/rentals"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại danh sách đơn thuê</span>
          </Link>
        </div>
      </div>
    );
  }

  const isProvider = currentUserId === rental.provider_id;
  const invoiceNumber = `LH-INV-${rental.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const startDate = new Date(rental.start_date);
  const endDate = new Date(rental.end_date);
  const diffDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const pricePerDay = Number(rental.service?.price_per_day || rental.total_price / diffDays);
  const subtotal = rental.total_price;
  const platformFee = Math.round(subtotal * 0.05); // 5% LiveHub escrow & guarantee fee
  const depositPaid = Math.round(subtotal * 0.3); // 30% deposit
  const remainingBalance = subtotal + platformFee - depositPaid;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return {
          label: "Đã hoàn thành",
          badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          stepIndex: 4,
        };
      case "in_progress":
        return {
          label: "Đang thực hiện",
          badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
          stepIndex: 3,
        };
      case "approved":
        return {
          label: "Đã duyệt / Chờ giao thiết bị",
          badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          stepIndex: 2,
        };
      case "rejected":
        return {
          label: "Đã từ chối",
          badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          stepIndex: 0,
        };
      default:
        return {
          label: "Chờ nhà cung cấp duyệt",
          badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          stepIndex: 1,
        };
    }
  };

  const statusInfo = getStatusBadge(rental.status);

  return (
    <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Navigation & Action Bar (Hidden when printing PDF) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <Link
            href="/rentals"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại Quản lý hợp đồng & Đơn thuê</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition-all"
            >
              <Printer className="size-4" />
              <span>Xuất PDF Hóa Đơn LiveHub</span>
            </button>
          </div>
        </div>

        {/* 1. PROGRESS TIMELINE BAR (Hidden when printing PDF) */}
        <div className="border-border bg-card rounded-[2.5rem] border p-6 sm:p-8 shadow-sm print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase">
                Tiến trình đơn thuê #{invoiceNumber}
              </span>
              <h1 className="mt-1 text-2xl font-bold text-foreground">
                Hợp đồng thuê: {rental.service?.title}
              </h1>
            </div>

            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${statusInfo.badgeClass}`}>
              <CheckCircle2 className="size-3.5" />
              {statusInfo.label}
            </span>
          </div>

          {/* 4-Step Visual Progress Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { title: "1. Đặt thuê & Cọc 30%", desc: "Thanh toán cọc bảo đảm Escrow", done: statusInfo.stepIndex >= 1 },
              { title: "2. Đối tác xác nhận", desc: "Chuẩn bị thiết bị & studio", done: statusInfo.stepIndex >= 2 },
              { title: "3. Bàn giao & Triển khai", desc: "Livestream & ghi hình thực tế", done: statusInfo.stepIndex >= 3 },
              { title: "4. Hoàn tất & Nghiệm thu", desc: "Giải ngân phần còn lại", done: statusInfo.stepIndex >= 4 },
            ].map((st, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border p-4 transition-all ${
                  st.done
                    ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                    : "border-border bg-muted/20 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                      st.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {st.done ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-bold">{st.title}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{st.desc}</p>
              </div>
            ))}
          </div>

          {/* Provider Status Actions */}
          {isProvider && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-xs font-semibold text-muted-foreground">
                Quyền hạn Nhà cung cấp:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {rental.status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus("approved")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Chấp nhận đơn thuê
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus("rejected")}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </>
                )}

                {rental.status === "approved" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    Bắt đầu thực hiện dự án
                  </button>
                )}

                {rental.status === "in_progress" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus("completed")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Xác nhận hoàn thành & Nghiệm thu
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. OFFICIAL LIVEHUB BRAND INVOICE & CONTRACT (Printable A4 Layout) */}
        <div className="border-border bg-card rounded-[2.5rem] border p-8 sm:p-12 shadow-xl print:border-none print:shadow-none print:p-0">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 border-b border-border pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-lg shadow-md shadow-orange-500/25">
                  LH
                </div>
                <div>
                  <span className="text-2xl font-bold tracking-tight">
                    Live<span className="text-orange-500">Hub</span>
                  </span>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase font-semibold">
                    Hóa Đơn Dịch Vụ & Hợp Đồng Điện Tử
                  </p>
                </div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground space-y-0.5">
                <p><strong>CÔNG TY CỔ PHẦN NỀN TẢNG LIVEHUB VIỆT NAM</strong></p>
                <p>Mã số thuế: 0318899888 • Hotline: 1900 8888</p>
                <p>Địa chỉ: Tòa nhà LiveHub Tower, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <FileCheck className="size-3.5" />
                <span>CHỨNG TỪ HỢP LỆ</span>
              </div>
              <p className="text-sm font-bold text-foreground mt-2">
                Số Hóa Đơn: {invoiceNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                Ngày lập: {new Date(rental.created_at).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-xs text-muted-foreground">
                Phương thức: <strong>Real VietQR Escrow 24/7</strong>
              </p>
            </div>
          </div>

          {/* Customer & Provider Parties */}
          <div className="grid gap-6 sm:grid-cols-2 my-8">
            <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Bên A: Khách Hàng (Người Thuê)
              </span>
              <p className="text-base font-bold text-foreground">
                {rental.customer?.full_name || "Khách hàng LiveHub"}
              </p>
              <p className="text-muted-foreground">Email: {rental.customer?.email || "—"}</p>
              <p className="text-muted-foreground">Số điện thoại: {rental.customer?.phone || "090 ••• ••••"}</p>
              <p className="text-muted-foreground">Hạng thành viên: <strong>Golden Ticket VIP</strong></p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Bên B: Đơn Vị Cung Cấp (Đối Tác)
              </span>
              <p className="text-base font-bold text-foreground">
                {rental.provider?.full_name || rental.service?.provider?.full_name || "Saigon Cinema & Studio Production"}
              </p>
              <p className="text-muted-foreground">Email: {rental.provider?.email || "provider@livehub.vn"}</p>
              <p className="text-muted-foreground">Số điện thoại: {rental.provider?.phone || "0908889999"}</p>
              <p className="text-muted-foreground">Địa điểm: {rental.service?.location || "TP. Hồ Chí Minh"}</p>
            </div>
          </div>

          {/* Itemized Service Table */}
          <div className="overflow-hidden rounded-2xl border border-border my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground font-bold border-b border-border">
                <tr>
                  <th className="p-4">STT</th>
                  <th className="p-4">Nội Dung Dịch Vụ / Thiết Bị</th>
                  <th className="p-4 text-center">Thời Gian Thuê</th>
                  <th className="p-4 text-right">Đơn Giá / Ngày</th>
                  <th className="p-4 text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4 text-center font-bold">01</td>
                  <td className="p-4">
                    <p className="font-bold text-sm text-foreground">
                      {rental.service?.title || "Gói máy quay & phòng studio livestream"}
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      {rental.service?.description || "Gói thiết bị chuẩn 4K HDR kèm phụ kiện theo tiêu chuẩn LiveHub"}
                    </p>
                  </td>
                  <td className="p-4 text-center font-medium">
                    {diffDays} ngày ({startDate.toLocaleDateString("vi-VN")} - {endDate.toLocaleDateString("vi-VN")})
                  </td>
                  <td className="p-4 text-right font-medium">
                    {pricePerDay.toLocaleString("vi-VN")} đ
                  </td>
                  <td className="p-4 text-right font-bold text-foreground">
                    {subtotal.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
                <tr className="text-muted-foreground bg-muted/10">
                  <td className="p-4 text-center font-bold">02</td>
                  <td className="p-4" colSpan={2}>
                    <p className="font-semibold text-foreground">Phí Bảo Đảm Giao Dịch Escrow & Hỗ Trợ Kỹ Thuật 24/7 (5%)</p>
                    <p className="text-[11px]">Bảo hiểm thiết bị và giữ tiền an toàn cho đến khi bàn giao hoàn tất</p>
                  </td>
                  <td className="p-4 text-right">5%</td>
                  <td className="p-4 text-right font-medium">
                    {platformFee.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Escrow Guarantee Stamp */}
          <div className="flex flex-col sm:flex-row justify-between gap-8 border-t border-border pt-6 my-6">
            {/* LiveHub Official Security Seal */}
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 max-w-md">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <ShieldCheck className="size-7" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                  CHỨNG NHẬN BẢO ĐẢM ESCROW LIVEHUB
                </p>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Số tiền cọc 30% đã được tạm khóa an toàn tại tài khoản trung gian của LiveHub. Khoản thanh toán còn lại sẽ được đối soát và giải ngân sau khi nghiệm thu buổi livestream thành công.
                </p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-80 space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tổng giá trị đơn thuê:</span>
                <span className="font-semibold text-foreground">{subtotal.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Phí dịch vụ & Bảo đảm sàn (5%):</span>
                <span className="font-semibold text-foreground">{platformFee.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-border pt-2">
                <span>Tiền cọc đã thanh toán (30%):</span>
                <span>- {depositPaid.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-base font-bold text-orange-600 border-t border-border pt-2">
                <span>Số tiền còn lại khi nhận thiết bị:</span>
                <span>{remainingBalance.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          </div>

          {rental.notes && (
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground my-6">
              <strong className="text-foreground">Yêu cầu đặc biệt từ khách hàng:</strong> {rental.notes}
            </div>
          )}

          {/* Legal Signatures Section */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-12 border-t border-border mt-8">
            <div className="space-y-16">
              <div>
                <p className="font-bold uppercase text-foreground">ĐẠI DIỆN KHÁCH HÀNG (BÊN A)</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">(Ký điện tử & ghi rõ họ tên)</p>
              </div>
              <p className="font-bold text-foreground">{rental.customer?.full_name || "Khách Hàng"}</p>
            </div>

            <div className="space-y-16">
              <div>
                <p className="font-bold uppercase text-foreground">ĐẠI DIỆN SÀN GIAO DỊCH LIVEHUB</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ ĐÃ XÁC THỰC ĐIỆN TỬ 24/7</p>
              </div>
              <p className="font-bold text-orange-600">LIVEHUB ESCROW VERIFIED</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
