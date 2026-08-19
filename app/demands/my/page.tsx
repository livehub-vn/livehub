"use client";

import { createClient } from "@/lib/supabase/client";
import type { Demand, DemandApplication } from "@/lib/types/database";
import { getDemandImages } from "@/lib/demand-helpers";
import { SafeImage } from "@/components/ui/safe-image";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DemandWithApplications extends Demand {
  applications?: DemandApplication[];
}

export default function MyDemandsPage() {
  const [demands, setDemands] = useState<DemandWithApplications[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyDemands = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: demandData } = await supabase
      .from("demands")
      .select("*, applications:demand_applications(*, provider:profiles(*))")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (demandData) {
      setDemands(demandData as DemandWithApplications[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchMyDemands(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng nhu cầu này?")) return;
    const supabase = createClient();
    await supabase.from("demands").delete().eq("id", id);
    fetchMyDemands();
  };

  const handleAcceptApplication = async (
    applicationId: string,
    demandId: string
  ) => {
    const supabase = createClient();
    // Accept selected application
    await supabase
      .from("demand_applications")
      .update({ status: "approved" })
      .eq("id", applicationId);

    // Reject other applications for this demand
    await supabase
      .from("demand_applications")
      .update({ status: "rejected" })
      .eq("demand_id", demandId)
      .neq("id", applicationId);

    // Close demand
    await supabase
      .from("demands")
      .update({ status: "closed" })
      .eq("id", demandId);

    fetchMyDemands();
  };

  return (
    <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-0 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl px-4 xl:px-0">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/demands"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Trở về Sàn nhu cầu</span>
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <Link
            href="/"
            className="text-muted-foreground/70 hover:text-foreground inline-flex items-center text-xs transition-colors"
          >
            <span>Trang chủ</span>
          </Link>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Nhu cầu dự án của tôi
            </h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Quản lý danh sách các nhu cầu tuyển chọn nhà cung cấp và duyệt báo
              giá từ các ekip.
            </p>
          </div>

          <Link
            href="/demands/new"
            className="bg-accent inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            <span>Tạo nhu cầu mới</span>
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-border bg-card space-y-4 rounded-[2rem] border p-6 shadow-md"
              >
                <div className="border-border/60 -mx-6 flex flex-col gap-4 border-b px-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-48 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="size-8 rounded-xl" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : demands.length === 0 ? (
          <div className="border-border bg-card mt-8 rounded-[2.5rem] border p-12 text-center">
            <h3 className="text-base font-medium">
              Bạn chưa có nhu cầu dự án nào
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Nhấn nút “Tạo nhu cầu mới” để tìm kiếm nhà cung cấp phù hợp.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {demands.map((demand) => {
              const dImages = getDemandImages(demand);
              return (
                <div
                  key={demand.id}
                  className="border-border bg-card rounded-[2rem] border p-6 shadow-md"
                >
                  <div className="border-border/60 -mx-6 flex flex-col gap-4 border-b px-6 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      {/* Image Thumbnail */}
                      <div className="relative size-18 shrink-0 overflow-hidden rounded-2xl bg-muted border border-border">
                        <SafeImage
                          src={dImages[0]!}
                          alt={demand.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-base sm:text-lg font-semibold">{demand.title}</h4>
                          <span
                            className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold ${
                              demand.status === "approved"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : demand.status === "closed"
                                  ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                                  : demand.status === "rejected"
                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                                    : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {demand.status === "approved"
                              ? "Đang mở ứng tuyển"
                              : demand.status === "closed"
                                ? "Đã chọn nhà cung cấp"
                                : demand.status === "rejected"
                                  ? "Từ chối"
                                  : "Chờ duyệt"}
                          </span>
                        </div>

                        <p className="text-muted-foreground mt-1 text-xs">
                          Ngân sách: {Number(demand.budget).toLocaleString("vi-VN")} đ • Địa
                          điểm: {demand.location} • Ngày:{" "}
                          {demand.event_date || "Chưa xác định"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/demands/${demand.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
                      >
                        <span>Xem chi tiết & Tiến trình</span>
                      </Link>

                      <button
                        onClick={() => handleDelete(demand.id)}
                        className="text-muted-foreground p-2 transition-colors hover:text-rose-500 rounded-xl hover:bg-rose-500/10 cursor-pointer"
                        title="Xóa bài đăng"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                {/* Applications list */}
                <div className="mt-4 pt-2">
                  <h5 className="text-muted-foreground text-xs font-semibold">
                    Danh sách báo giá ứng tuyển từ nhà cung cấp (
                    {demand.applications?.length || 0})
                  </h5>

                  {!demand.applications || demand.applications.length === 0 ? (
                    <p className="text-muted-foreground mt-3 text-xs italic">
                      Chưa có nhà cung cấp nào nộp báo giá cho dự án này.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {demand.applications.map((app) => (
                        <div
                          key={app.id}
                          className="border-border bg-muted/50 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-accent/10 text-accent flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                              {app.provider?.full_name?.[0] || "P"}
                            </div>
                            <div>
                              <h6 className="text-sm font-semibold">
                                {app.provider?.full_name}
                              </h6>
                              <p className="text-muted-foreground text-xs">
                                {app.proposal_note}
                              </p>
                            </div>
                          </div>

                          <div className="border-border flex items-center justify-between gap-4 border-t pt-2 sm:border-t-0 sm:pt-0">
                            <div className="text-right">
                              <span className="text-muted-foreground text-[10px]">
                                Báo giá
                              </span>
                              <p className="text-accent text-sm font-semibold">
                                {app.proposed_price.toLocaleString("vi-VN")} đ
                              </p>
                            </div>

                            {app.status === "approved" ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                                Đã chấp thuận
                              </span>
                            ) : demand.status !== "closed" ? (
                              <button
                                onClick={() =>
                                  handleAcceptApplication(app.id, demand.id)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                              >
                                <Check className="size-3.5" />
                                <span>Chấp thuận báo giá</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
