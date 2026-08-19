"use client";

import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/lib/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MyServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyServices = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setServices(data as Service[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchMyServices(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng dịch vụ này?")) return;
    const supabase = createClient();
    await supabase.from("services").delete().eq("id", id);
    fetchMyServices();
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

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Quản lý dịch vụ của tôi
            </h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Theo dõi trạng thái kiểm duyệt bài viết và quản lý các thiết
              bị/dịch vụ bạn cung cấp.
            </p>
          </div>

          <Link
            href="/services/new"
            className="bg-accent inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            <span>Đăng bài mới</span>
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="size-16 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="size-8 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="border-border bg-card mt-8 rounded-[2.5rem] border p-12 text-center">
            <h3 className="text-base font-medium">Bạn chưa đăng dịch vụ nào</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Nhấn nút “Đăng bài mới” để giới thiệu thiết bị hoặc ekip của bạn.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
                    {service.images && service.images.length > 0 ? (
                      <Image
                        src={service.images[0]!}
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
                    <h4 className="text-base font-semibold">{service.title}</h4>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {service.price_per_day.toLocaleString("vi-VN")} đ/ngày •{" "}
                      {service.location}
                    </p>
                  </div>
                </div>

                <div className="border-border -mx-4 flex items-center justify-between gap-4 border-t px-4 pt-3 sm:mx-0 sm:border-t-0 sm:p-0">
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      service.status === "approved"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : service.status === "rejected"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {service.status === "approved"
                      ? "Đã duyệt"
                      : service.status === "rejected"
                        ? "Từ chối"
                        : "Chờ duyệt"}
                  </span>

                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-muted-foreground p-2 transition-colors hover:text-rose-500"
                    title="Xóa bài đăng"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
