"use client";

import { GoldenTicketBadge } from "@/components/golden-ticket-badge";
import { RejectReasonDialog } from "@/components/reject-reason-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import type { Service } from "@/lib/types/database";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Edit3,
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
  const [rejectTarget, setRejectTarget] = useState<Service | null>(null);

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
    setRejectTarget(service);
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
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 items-stretch">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col h-full rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
            >
              <Skeleton className="aspect-16/10 w-full rounded-2xl mb-3.5" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-36 rounded-xl" />
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
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 items-stretch">
          {displayedServices.map((service) => {
            const busy = activeId === service.id;
            const tier = service.provider?.membership_tier;
            const isVip = tier === "premium" || tier === "standard";
            const serviceImages = service.images || [];
            const hasImage = serviceImages.length > 0 && !!serviceImages[0];

            return (
              <article
                key={service.id}
                className={`group flex flex-col h-full rounded-3xl border bg-white p-4 sm:p-5 transition-all duration-300 shadow-xs hover:shadow-xl ${
                  tier === "premium"
                    ? "border-amber-300/90 ring-1 ring-amber-400/30"
                    : tier === "standard"
                      ? "border-blue-200 ring-1 ring-blue-300/20"
                      : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Thumbnail Image with Padding & Rounded-2xl like homepage */}
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 mb-3.5 ring-1 ring-slate-200/60 shrink-0">
                  {hasImage ? (
                    <Image
                      src={serviceImages[0]!}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-slate-50 flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="text-xs font-semibold text-slate-500">Chưa có ảnh bìa</span>
                      </div>
                    </div>
                  )}

                  {/* Badges Bar on Thumbnail */}
                  <div className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 flex items-center justify-between gap-2 z-10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-black/75 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs uppercase tracking-wider whitespace-nowrap shrink-0">
                        {service.category === "equipment"
                          ? "Thiết bị"
                          : service.category === "studio"
                            ? "Studio"
                            : "Ekip"}
                      </span>
                      {isVip && (
                        <GoldenTicketBadge
                          tier={tier}
                          variant="admin-tag"
                        />
                      )}
                    </div>

                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold shadow-sm text-white whitespace-nowrap shrink-0 ${
                        service.status === "approved"
                          ? "bg-emerald-600"
                          : service.status === "rejected"
                            ? "bg-rose-600"
                            : service.status === "closed"
                              ? "bg-slate-700"
                              : "bg-amber-500"
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
                  </div>

                  {/* Multi-image count */}
                  {serviceImages.length > 1 && (
                    <div className="absolute bottom-2.5 right-2.5 z-10 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      +{serviceImages.length - 1} ảnh
                    </div>
                  )}
                </div>

                {/* Card Main Content */}
                <div className="flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <h2 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {service.title}
                    </h2>

                    {service.description && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {service.description}
                      </p>
                    )}

                    {service.location && (
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        📍 {service.location}
                      </p>
                    )}
                  </div>

                  {service.provider?.full_name && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate">
                        Nhà cung cấp: <strong className="text-slate-800 font-semibold">{service.provider.full_name}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Structured in 2 Clean Rows */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3">
                  {/* Row 1: Price & Secondary Utility Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Đơn giá thuê
                      </p>
                      <p className="mt-0.5 text-base font-extrabold text-orange-600">
                        {Number(service.price_per_day).toLocaleString("vi-VN")} đ<span className="text-xs font-semibold text-slate-500">/ngày</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/services/${service.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
                        title="Xem trang công khai"
                        aria-label={`Xem ${service.title}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                      <Link
                        href={`/admin/services/${service.id}/edit`}
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
                        title="Chỉnh sửa thông tin và hình ảnh"
                      >
                        <Edit3 className="size-3 text-orange-500" /> Sửa
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(service)}
                        disabled={busy}
                        className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 shadow-xs cursor-pointer transition-colors"
                        title="Xóa dịch vụ"
                        aria-label={`Xóa ${service.title}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Smart Status-based Action Bar */}
                  {service.status === "approved" ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200/80 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>Đang hiển thị công khai</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReject(service)}
                        disabled={busy}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 cursor-pointer transition-colors shrink-0"
                        title="Thu hồi hoặc từ chối dịch vụ này"
                      >
                        <X className="size-3 text-rose-500" /> Thu hồi / Từ chối
                      </button>
                    </div>
                  ) : service.status === "rejected" ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50/80 border border-rose-200/80 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 truncate">
                        <X className="size-4 text-rose-600 shrink-0" />
                        <span className="truncate" title={service.rejection_reason || "Đã từ chối"}>
                          {service.rejection_reason ? `Lý do: ${service.rejection_reason}` : "Đã từ chối"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void updateService(service, "approved")}
                        disabled={busy}
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors shrink-0"
                        title="Phê duyệt lại dịch vụ này"
                      >
                        <Check className="size-3" /> Duyệt lại
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void updateService(service, "approved")}
                        disabled={busy}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        <Check className="size-4" /> Duyệt bài
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(service)}
                        disabled={busy}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        <X className="size-4" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Reusable Reject Reason Dialog */}
      <RejectReasonDialog
        open={Boolean(rejectTarget)}
        title="Từ chối dịch vụ / thiết bị"
        itemTitle={rejectTarget?.title}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return;
          const target = rejectTarget;
          setRejectTarget(null);
          void updateService(target, "rejected", reason);
        }}
        loading={Boolean(activeId)}
      />
    </div>
  );
}
