"use client";

import { GoldenTicketBadge } from "@/components/golden-ticket-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import type { Service } from "@/lib/types/database";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
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

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchServices = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const queryStatus = filterStatus === "vip" ? "all" : filterStatus;
        const response = await adminFetch<{ services: Service[] }>(
          `/api/admin/services?status=${queryStatus}`,
          signal ? { signal } : undefined
        );
        setServices(response.services);
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
            : "Không thể tải danh sách dịch vụ."
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
      void fetchServices(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(taskId);
      controller.abort();
    };
  }, [fetchServices]);

  const updateService = async (
    service: Service,
    status: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    setActiveId(service.id);
    setError(null);
    setNotice(null);
    try {
      const response = await adminFetch<{ service: Service }>(
        `/api/admin/services/${service.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, rejectionReason }),
        }
      );

      if (filterStatus === "all" || filterStatus === status) {
        setServices((current) =>
          current.map((item) =>
            item.id === service.id ? response.service : item
          )
        );
      } else {
        setServices((current) =>
          current.filter((item) => item.id !== service.id)
        );
      }
      setNotice(
        status === "approved"
          ? `Đã duyệt “${service.title}”.`
          : `Đã từ chối “${service.title}”.`
      );
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể cập nhật dịch vụ."
      );
    } finally {
      setActiveId(null);
    }
  };

  const handleReject = (service: Service) => {
    const reason = window.prompt("Nhập lý do từ chối bài đăng này:");
    if (!reason?.trim()) return;
    void updateService(service, "rejected", reason.trim());
  };

  const handleDelete = async (service: Service) => {
    if (
      !window.confirm(
        `Xóa vĩnh viễn dịch vụ “${service.title}”? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setActiveId(service.id);
    setError(null);
    setNotice(null);
    try {
      await adminFetch<{ success: true }>(`/api/admin/services/${service.id}`, {
        method: "DELETE",
      });
      setServices((current) =>
        current.filter((item) => item.id !== service.id)
      );
      setNotice(`Đã xóa “${service.title}”.`);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể xóa dịch vụ."
      );
    } finally {
      setActiveId(null);
    }
  };

  // Filter & priority sort for Golden ticket / VIP members
  const displayedServices = useMemo(() => {
    let list = [...services];
    if (filterStatus === "vip") {
      list = list.filter((s) => {
        const tier = s.provider?.membership_tier;
        return tier === "premium" || tier === "standard";
      });
    }

    // Sort VIP items to the top
    return list.sort((a, b) => {
      const tierA = a.provider?.membership_tier;
      const tierB = b.provider?.membership_tier;
      const weightA = tierA === "premium" ? 2 : tierA === "standard" ? 1 : 0;
      const weightB = tierB === "premium" ? 2 : tierB === "standard" ? 1 : 0;
      if (weightB !== weightA) return weightB - weightA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [services, filterStatus]);

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 sm:space-y-8 text-slate-900">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-orange-600 uppercase">
            Moderation Queue · Hàng đợi kiểm duyệt
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Kiểm duyệt dịch vụ sàn
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Duyệt thiết bị máy quay, phòng studio và ekip kỹ thuật viên trước khi xuất hiện trên sàn LiveHub. Tin từ đối tác Golden Ticket được đánh dấu ưu tiên xử lý trong 15 phút.
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
            onClick={() => void fetchServices()}
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
            onClick={() => void fetchServices()}
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
            >
              <Skeleton className="size-20 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-3 py-1">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-5 w-3/5 rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedServices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-xs">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
          <p className="mt-3 text-sm font-bold text-slate-800">
            Không có dịch vụ trong danh mục này
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hàng đợi kiểm duyệt hiện tại đã được xử lý xong.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedServices.map((service) => {
            const busy = activeId === service.id;
            const tier = service.provider?.membership_tier;
            const isVip = tier === "premium" || tier === "standard";

            return (
              <article
                key={service.id}
                className={`group grid gap-5 rounded-3xl border p-4 transition-all duration-200 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center shadow-xs hover:shadow-md ${
                  tier === "premium"
                    ? "border-amber-300/80 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 ring-1 ring-amber-400/40"
                    : tier === "standard"
                      ? "border-blue-200 bg-gradient-to-r from-blue-50/30 via-white to-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex min-w-0 gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:size-24 ring-1 ring-slate-200">
                    {service.images?.[0] ? (
                      <Image
                        src={service.images[0]}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[10px] text-slate-400 font-medium">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-orange-700 uppercase">
                        {service.category}
                      </span>
                      <span className="truncate text-[11px] font-medium text-slate-500">
                        {service.location}
                      </span>
                      {/* Golden Ticket / VIP Indicator */}
                      {isVip && (
                        <GoldenTicketBadge
                          tier={tier}
                          variant="admin-tag"
                          showSla={true}
                        />
                      )}
                      {service.provider?.full_name && (
                        <span className="text-[11px] text-slate-500">
                          bởi <strong className="text-slate-700">{service.provider.full_name}</strong>
                        </span>
                      )}
                    </div>
                    <h2 className="line-clamp-2 text-sm font-bold text-slate-900 sm:text-base">
                      {service.title}
                    </h2>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {service.description}
                    </p>
                    <p className="text-xs font-bold text-orange-600">
                      {Number(service.price_per_day).toLocaleString("vi-VN")}{" "}
                      đ/ngày
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 xl:justify-end xl:border-t-0 xl:border-l xl:pt-0 xl:pl-5">
                  <span
                    className={`mr-auto rounded-full border px-3 py-1 text-[10px] font-bold xl:mr-2 ${
                      service.status === "approved"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : service.status === "rejected"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {service.status === "approved"
                      ? "Đã duyệt"
                      : service.status === "rejected"
                        ? "Từ chối"
                        : service.status === "closed"
                          ? "Đã đóng"
                          : "Chờ duyệt"}
                  </span>

                  <Link
                    href={`/services/${service.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
                    title="Xem trang công khai"
                    aria-label={`Xem ${service.title}`}
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                  {service.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => void updateService(service, "approved")}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="size-3.5" /> Duyệt
                    </button>
                  )}
                  {service.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleReject(service)}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <X className="size-3.5" /> Từ chối
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(service)}
                    disabled={busy}
                    className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 shadow-xs"
                    title="Xóa dịch vụ"
                    aria-label={`Xóa ${service.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
