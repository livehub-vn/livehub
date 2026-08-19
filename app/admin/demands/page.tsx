"use client";

import { GoldenTicketBadge } from "@/components/golden-ticket-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import type { Demand } from "@/lib/types/database";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ExternalLink,
  MapPin,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type FilterStatus = "pending" | "vip" | "approved" | "rejected" | "all";

const filterLabels: Record<FilterStatus, string> = {
  pending: "Chờ duyệt",
  vip: "Golden Ticket VIP",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  all: "Tất cả",
};

export default function AdminDemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchDemands = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const queryStatus = filterStatus === "vip" ? "all" : filterStatus;
        const response = await adminFetch<{ demands: Demand[] }>(
          `/api/admin/demands?status=${queryStatus}`,
          signal ? { signal } : undefined
        );
        setDemands(response.demands);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Không thể tải danh sách nhu cầu."
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filterStatus]
  );

  useEffect(() => {
    const controller = new AbortController();
    const taskId = window.setTimeout(() => {
      void fetchDemands(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(taskId);
      controller.abort();
    };
  }, [fetchDemands]);

  const updateDemand = async (
    demand: Demand,
    status: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    setActiveId(demand.id);
    setError(null);
    setNotice(null);
    try {
      const response = await adminFetch<{ demand: Demand }>(
        `/api/admin/demands/${demand.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, rejectionReason }),
        }
      );

      if (filterStatus === "all" || filterStatus === status) {
        setDemands((current) =>
          current.map((item) =>
            item.id === demand.id ? response.demand : item
          )
        );
      } else {
        setDemands((current) =>
          current.filter((item) => item.id !== demand.id)
        );
      }
      setNotice(
        status === "approved"
          ? `Đã duyệt “${demand.title}”.`
          : `Đã từ chối “${demand.title}”.`
      );
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể cập nhật nhu cầu."
      );
    } finally {
      setActiveId(null);
    }
  };

  const handleReject = (demand: Demand) => {
    const reason = window.prompt("Nhập lý do từ chối nhu cầu này:");
    if (!reason?.trim()) return;
    void updateDemand(demand, "rejected", reason.trim());
  };

  const handleDelete = async (demand: Demand) => {
    if (
      !window.confirm(
        `Xóa vĩnh viễn nhu cầu “${demand.title}”? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setActiveId(demand.id);
    setError(null);
    setNotice(null);
    try {
      await adminFetch<{ success: true }>(`/api/admin/demands/${demand.id}`, {
        method: "DELETE",
      });
      setDemands((current) => current.filter((item) => item.id !== demand.id));
      setNotice(`Đã xóa “${demand.title}”.`);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể xóa nhu cầu."
      );
    } finally {
      setActiveId(null);
    }
  };

  // Filter & priority sort for Golden ticket / VIP members
  const displayedDemands = useMemo(() => {
    let list = [...demands];
    if (filterStatus === "vip") {
      list = list.filter((d) => {
        const tier = d.customer?.membership_tier;
        return tier === "premium" || tier === "standard";
      });
    }

    return list.sort((a, b) => {
      const tierA = a.customer?.membership_tier;
      const tierB = b.customer?.membership_tier;
      const weightA = tierA === "premium" ? 2 : tierA === "standard" ? 1 : 0;
      const weightB = tierB === "premium" ? 2 : tierB === "standard" ? 1 : 0;
      if (weightB !== weightA) return weightB - weightA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [demands, filterStatus]);

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 sm:space-y-8 text-slate-900">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-orange-600 uppercase">
            Project Intake · Kiểm duyệt nhu cầu tuyển dụng & thuê
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Kiểm duyệt nhu cầu dự án
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Kiểm tra yêu cầu tuyển dụng ekip, tìm phòng quay và thuê máy trước khi mở cho các nhà cung cấp báo giá.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xs">
            {(Object.keys(filterLabels) as FilterStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`min-h-9 shrink-0 rounded-xl px-3.5 text-[11px] font-bold transition-all ${
                  filterStatus === status
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {filterLabels[status]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void fetchDemands()}
            disabled={loading}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 shadow-xs"
            aria-label="Làm mới danh sách"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <span className="flex-1 font-medium">{error}</span>
          <button
            type="button"
            onClick={() => void fetchDemands()}
            className="font-bold underline underline-offset-2 hover:text-rose-950"
          >
            Thử lại
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 shadow-xs font-medium"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          {notice}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayedDemands.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-xs">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
          <p className="mt-3 text-sm font-bold text-slate-800">
            Không có nhu cầu trong danh mục này
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hàng đợi kiểm duyệt hiện tại đã được xử lý xong.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-3 lg:grid-cols-2">
          {displayedDemands.map((demand) => {
            const busy = activeId === demand.id;
            const tier = demand.customer?.membership_tier;
            const isVip = tier === "premium" || tier === "standard";

            return (
              <article
                key={demand.id}
                className={`rounded-3xl border p-5 transition-all duration-200 shadow-xs hover:shadow-md ${
                  tier === "premium"
                    ? "border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 ring-1 ring-amber-400/40"
                    : tier === "standard"
                      ? "border-blue-200 bg-gradient-to-br from-blue-50/30 via-white to-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-orange-700 uppercase">
                      Nhu cầu dự án
                    </span>
                    {isVip && (
                      <GoldenTicketBadge
                        tier={tier}
                        variant="admin-tag"
                        showSla={true}
                      />
                    )}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                      demand.status === "approved"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : demand.status === "rejected"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {demand.status === "approved"
                      ? "Đã duyệt"
                      : demand.status === "rejected"
                        ? "Từ chối"
                        : demand.status === "closed"
                          ? "Đã đóng"
                          : "Chờ duyệt"}
                  </span>
                </div>

                <h2 className="mt-3.5 line-clamp-2 text-base font-bold text-slate-900 sm:text-lg">
                  {demand.title}
                </h2>
                {/* Optional Image Preview in Admin Card */}
                {demand.images && demand.images.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                      <Image
                        src={demand.images[0]!}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    {demand.images.length > 1 && (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                        +{demand.images.length - 1} ảnh đính kèm
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/60 px-3 py-2 text-[11px] font-medium text-slate-600">
                    <MapPin className="size-3.5 shrink-0 text-orange-500" />
                    <span className="truncate">{demand.location}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/60 px-3 py-2 text-[11px] font-medium text-slate-600">
                    <CalendarDays className="size-3.5 shrink-0 text-orange-500" />
                    <span>
                      {new Date(demand.event_date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {demand.customer?.full_name && (
                  <p className="mt-3 mb-2 text-[11px] text-slate-500">
                    Người đăng: <strong className="text-slate-700">{demand.customer.full_name}</strong> ({demand.customer.email})
                  </p>
                )}

                <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-4 flex items-center justify-between gap-3 border-t border-slate-100 px-5 sm:px-6 py-4 bg-slate-50/70 rounded-b-3xl">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400">
                      Ngân sách dự kiến
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-orange-600">
                      {Number(demand.budget).toLocaleString("vi-VN")} đ
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/demands/${demand.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
                      title="Xem trang công khai"
                      aria-label={`Xem ${demand.title}`}
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                    {demand.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => void updateDemand(demand, "approved")}
                        disabled={busy}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="size-3.5" /> Duyệt
                      </button>
                    )}
                    {demand.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleReject(demand)}
                        disabled={busy}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        <X className="size-3.5" /> Từ chối
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(demand)}
                      disabled={busy}
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 shadow-xs"
                      title="Xóa nhu cầu"
                      aria-label={`Xóa ${demand.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
