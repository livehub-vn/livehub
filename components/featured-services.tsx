"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { Skeleton } from "@/components/ui/skeleton";
import { loginWithGoogle } from "@/lib/auth-client";
import { SEED_SERVICES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Camera, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const categoryLabels: Record<string, string> = {
  equipment: "Thiết bị",
  studio: "Studio",
  crew: "Ekip",
  all: "Tất cả",
};

export function FeaturedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const supabase = createClient();

        // Get auth status
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUser(session?.user ?? null);

        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(3);

        if (data && data.length > 0 && !error) {
          setServices(data as Service[]);
        } else {
          setServices(SEED_SERVICES.slice(0, 3));
        }
      } catch {
        setServices(SEED_SERVICES.slice(0, 3));
      } finally {
        setLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  return (
    <section className="relative border-t border-border bg-background py-16 text-foreground">
      <div className="mx-auto max-w-6xl px-4 xl:px-0">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-500">
              <Sparkles className="size-3.5" />
              <span>Sàn dịch vụ trực tiếp</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Dịch vụ livestream <AuroraText>nổi bật</AuroraText>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
              Thiết bị máy quay 4K, phòng quay phông xanh, ánh sáng và ekip kỹ thuật viên đã được kiểm định chất lượng sẵn sàng phục vụ.
            </p>
          </div>

          <Link
            href="/services"
            className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-orange-500 hover:text-orange-500"
          >
            <span>Xem tất cả dịch vụ</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-3.5 shadow-sm space-y-4"
              >
                <div>
                  <Skeleton className="aspect-16/10 w-full rounded-2xl" />
                  <div className="mt-3.5 space-y-2 px-1">
                    <Skeleton className="h-5 w-4/5 rounded-md" />
                    <Skeleton className="h-3.5 w-full rounded-md" />
                  </div>
                </div>
                <div className="border-t border-border/60 pt-3 px-1 flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative mt-8 min-h-[320px] rounded-3xl">
            {/* Grid of sample cards */}
            <div
              className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
                !currentUser
                  ? "pointer-events-none select-none filter blur-[4px] opacity-70 transition-all"
                  : ""
              }`}
            >
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={currentUser ? `/services/${service.id}` : "#"}
                  onClick={(e) => {
                    if (!currentUser) {
                      e.preventDefault();
                      loginWithGoogle(`/services/${service.id}`);
                    }
                  }}
                  tabIndex={!currentUser ? -1 : 0}
                  className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                      {service.images && service.images.length > 0 && service.images[0] ? (
                        <Image
                          src={service.images[0]}
                          alt={service.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          <Camera className="size-6 opacity-40" />
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 rounded-full border border-black/10 bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                        {categoryLabels[service.category] || "Dịch vụ"}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="mt-3.5 px-1">
                      <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-orange-500">
                        {service.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer specs & price */}
                  <div className="mt-4 border-t border-border/70 pt-3 px-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="size-3.5 text-orange-500" />
                        <span>{service.location || "Toàn quốc"}</span>
                      </span>

                      <div className="text-right">
                        <span className="text-sm font-bold text-orange-500">
                          {service.price_per_day.toLocaleString("vi-VN")} đ
                        </span>
                        <span className="text-[11px] text-muted-foreground">/ngày</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Locked Blur Overlay for Guests */}
            {!currentUser && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-background/35 backdrop-blur-[2px] rounded-3xl">
                <div className="w-full max-w-lg rounded-[2.5rem] border border-orange-500/40 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-center ring-1 ring-orange-500/20 animate-in fade-in zoom-in-95 duration-300">
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 mb-3 shadow-xs">
                    <Sparkles className="size-4 text-orange-500" />
                    <span>Mở khóa Bảng giá & Nhà cung cấp</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    <AuroraText>Mở khóa 100+ Thiết bị & Studio Chuyên Nghiệp</AuroraText>
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Đăng nhập để xem đầy đủ báo giá, thông tin liên hệ nhà cung cấp và đặt lịch thuê thiết bị, studio livestream ngay.
                  </p>

                  <div className="mt-5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => loginWithGoogle("/services")}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-600 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                    >
                      <span>Gia nhập LiveHub miễn phí</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
