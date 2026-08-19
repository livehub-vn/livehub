"use client";

import { createClient } from "@/lib/supabase/client";
import type { ServiceRental } from "@/lib/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<ServiceRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchRentals = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRentals([]);
      setCurrentUserId(null);
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data } = await supabase
      .from("service_rentals")
      .select(
        "*, service:services(*), customer:profiles!customer_id(*), provider:profiles!provider_id(*)"
      )
      .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (data) {
      setRentals(data as ServiceRental[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchRentals();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleUpdateStatus = async (rentalId: string, newStatus: string) => {
    const supabase = createClient();
    await supabase
      .from("service_rentals")
      .update({ status: newStatus })
      .eq("id", rentalId);

    fetchRentals();
  };

  return (
    <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-0 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl px-4 xl:px-0">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Trở về Trang chủ</span>
        </Link>

        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Quản lý hợp đồng & dịch vụ thuê
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Theo dõi lịch trình giao nhận thiết bị, tiến trình thực hiện và xác
            nhận hoàn thành dịch vụ.
          </p>
        </div>

        {loading ? (
          <div className="mt-8 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-border bg-card space-y-4 rounded-[2rem] border p-6 shadow-md"
              >
                <div className="border-border/60 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-16 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-44 rounded-md" />
                      <Skeleton className="h-3.5 w-32 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-6 w-28 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="border-border bg-card mt-8 rounded-[2.5rem] border p-12 text-center">
            <h3 className="text-base font-medium">
              Bạn chưa có đơn thuê dịch vụ nào
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Hãy khám phá Sàn dịch vụ để thuê thiết bị hoặc ekip cho buổi
              livestream tiếp theo.
            </p>
            <Link
              href="/services"
              className="bg-accent mt-6 inline-block rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Khám phá Sàn dịch vụ
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {rentals.map((rental) => {
              const isProvider = currentUserId === rental.provider_id;

              return (
                <div
                  key={rental.id}
                  className="border-border bg-card rounded-[2rem] border p-6 shadow-md"
                >
                  <div className="border-border/60 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
                        {rental.service?.images &&
                        rental.service.images.length > 0 ? (
                          <Image
                            src={rental.service.images[0]!}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[10px] text-neutral-500">
                            No pic
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold">
                          {rental.service?.title}
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          {isProvider
                            ? `Khách thuê: ${rental.customer?.full_name}`
                            : `Nhà cung cấp: ${rental.provider?.full_name}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-3.5 py-1 text-xs font-semibold ${
                        rental.status === "completed"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : rental.status === "in_progress"
                            ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                            : rental.status === "rejected" ||
                                rental.status === "cancelled"
                              ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {rental.status === "completed"
                        ? "Đã hoàn thành"
                        : rental.status === "in_progress"
                          ? "Đang thực hiện"
                          : rental.status === "approved"
                            ? "Đã xác nhận thuê"
                            : rental.status === "cancelled"
                              ? "Đã hủy"
                              : rental.status === "rejected"
                                ? "Từ chối"
                                : "Chờ nhà cung cấp duyệt"}
                    </span>
                  </div>

                  <div className="text-muted-foreground mt-4 grid gap-4 text-xs sm:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-accent size-4" />
                      <span>
                        Thời gian:{" "}
                        {new Date(rental.start_date).toLocaleDateString(
                          "vi-VN"
                        )}{" "}
                        -{" "}
                        {new Date(rental.end_date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div>
                      <span>Tổng chi phí: </span>
                      <strong className="text-accent text-sm font-semibold">
                        {rental.total_price.toLocaleString("vi-VN")} đ
                      </strong>
                    </div>

                    {rental.notes && (
                      <div className="line-clamp-1 italic">
                        Ghi chú: {rental.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions for Provider / Customer */}
                  <div className="border-border/60 -mx-6 -mb-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 bg-muted/20 rounded-b-[2rem]">
                    <div className="text-xs font-medium text-muted-foreground">
                      <span>Mã đơn: <strong className="text-foreground">#{rental.id.slice(0, 8)}</strong></span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/rentals/${rental.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
                      >
                        <span>Xem chi tiết & Hóa đơn</span>
                      </Link>

                      {isProvider && rental.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateStatus(rental.id, "approved")
                            }
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-xs"
                          >
                            Chấp nhận đơn thuê
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(rental.id, "rejected")
                            }
                            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20"
                          >
                            Từ chối
                          </button>
                        </>
                      )}

                      {rental.status === "approved" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(rental.id, "in_progress")
                          }
                          className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-xs"
                        >
                          Bắt đầu thực hiện
                        </button>
                      )}

                      {rental.status === "in_progress" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(rental.id, "completed")
                          }
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-xs"
                        >
                          Xác nhận hoàn thành
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
