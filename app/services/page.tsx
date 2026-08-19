"use client";

import { GoldenTicketBadge, getTierPriorityWeight, getTierCardStyle } from "@/components/golden-ticket-badge";
import { AuroraText } from "@/components/ui/aurora-text";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED_SERVICES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Service, ServiceCategory } from "@/lib/types/database";
import { ArrowLeft, ArrowUpRight, Crown, Filter, Images, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const categories: { label: string; value: ServiceCategory | "all" }[] = [
  { label: "Tất cả dịch vụ", value: "all" },
  { label: "Thiết bị Livestream", value: "equipment" },
  { label: "Studio / Phòng quay", value: "studio" },
  { label: "Ekip sản xuất", value: "crew" },
  { label: "Kỹ thuật viên / Operator", value: "operator" },
];

const VALID_CATEGORIES: readonly ServiceCategory[] = [
  "equipment",
  "studio",
  "crew",
  "operator",
];

function isServiceCategory(value: string | null): value is ServiceCategory {
  return (
    value !== null && (VALID_CATEGORIES as readonly string[]).includes(value)
  );
}

function normalizeSearchTerm(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vipOnly, setVipOnly] = useState(false);

  const rawCategory = searchParams.get("category");
  const selectedCategory: ServiceCategory | "all" = isServiceCategory(
    rawCategory
  )
    ? rawCategory
    : "all";

  // Keep malformed external links from leaving an invalid category in the address bar.
  useEffect(() => {
    if (rawCategory && !isServiceCategory(rawCategory)) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("category");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `/services?${nextQuery}` : "/services", {
        scroll: false,
      });
    }
  }, [rawCategory, router, searchParams]);

  const handleCategoryChange = (value: ServiceCategory | "all") => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", value);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/services?${nextQuery}` : "/services", {
      scroll: false,
    });
  };

  useEffect(() => {
    let isCurrentRequest = true;

    async function fetchServices() {
      setLoading(true);
      setLoadError(null);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("services")
          .select("*, provider:profiles(*)")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (isCurrentRequest) {
          setServices((data ?? []) as Service[]);
        }
      } catch {
        if (isCurrentRequest) {
          setServices(
            SEED_SERVICES.filter((service) => service.status === "approved")
          );
          setLoadError(
            "Không thể kết nối dữ liệu trực tiếp. LiveHub đang hiển thị dữ liệu mẫu để bạn tiếp tục tham khảo."
          );
        }
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const normalizedSearchQuery = normalizeSearchTerm(searchQuery);
  const filteredServices = useMemo(() => {
    const list = services.filter((service) => {
      if (
        selectedCategory !== "all" &&
        service.category !== selectedCategory
      ) {
        return false;
      }

      if (vipOnly) {
        const tier = service.provider?.membership_tier;
        if (tier !== "premium" && tier !== "standard") return false;
      }

      if (!normalizedSearchQuery) {
        return true;
      }

      return [
        service.title,
        service.description,
        service.location,
        service.provider?.full_name ?? "",
      ].some((value) =>
        normalizeSearchTerm(value).includes(normalizedSearchQuery)
      );
    });

    // Priority sort: Golden VIP (Premium) > Standard Partner > Others, then by newest
    return list.sort((a, b) => {
      const weightA = getTierPriorityWeight(a.provider?.membership_tier);
      const weightB = getTierPriorityWeight(b.provider?.membership_tier);
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [normalizedSearchQuery, selectedCategory, services, vipOnly]);

  const selectedCategoryLabel = categories.find(
    (category) => category.value === selectedCategory
  )?.label;
  const hasActiveFilters =
    selectedCategory !== "all" || normalizedSearchQuery.length > 0 || vipOnly;

  const handleClearFilters = () => {
    setSearchQuery("");
    setVipOnly(false);
    router.replace("/services", { scroll: false });
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header Banner with generous top spacing */}
      <header className="border-border bg-card/60 border-b px-4 pt-28 pb-10 backdrop-blur-sm xl:px-0 sm:pt-32">
        <div className="mx-auto w-full max-w-6xl">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Trở về Trang chủ</span>
          </Link>

          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                  ⚡ Đối tác Golden Ticket VIP & Standard Partner
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sàn dịch vụ <AuroraText>LiveHub</AuroraText>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
                Tra cứu thiết bị chuyên nghiệp, phòng quay studio và ekip kỹ
                thuật viên livestream được kiểm duyệt chất lượng.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/services/my"
                className="border-border bg-background hover:bg-muted rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
              >
                Dịch vụ của tôi
              </Link>
              <Link
                href="/services/new"
                className="bg-accent inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600"
              >
                <Plus className="size-4" />
                <span>Đăng dịch vụ</span>
              </Link>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên thiết bị, studio, vị trí..."
                aria-label="Tìm kiếm dịch vụ"
                className="border-border bg-background focus:border-accent w-full rounded-xl border py-2.5 pr-4 pl-11 text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setVipOnly(!vipOnly)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${vipOnly
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400"
                    : "border border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                  }`}
              >
                <Crown className="size-3.5" />
                <span>⚡ Golden VIP</span>
              </button>

              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${selectedCategory === cat.value
                      ? "bg-accent font-semibold text-white shadow-sm"
                      : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground border"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto w-full max-w-6xl px-4 xl:px-0 py-10">
        {loadError && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed font-medium text-amber-800 dark:text-amber-200"
          >
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-border bg-card flex flex-col justify-between rounded-3xl border p-3.5 shadow-sm"
              >
                <div>
                  <Skeleton className="aspect-4/3 w-full rounded-2xl" />
                  <div className="mt-3.5 space-y-2 px-1">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3.5 w-20 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-4/5 rounded-md" />
                    <Skeleton className="h-3.5 w-full rounded-md" />
                  </div>
                </div>

                <div className="border-border/60 mt-5 flex items-center justify-between border-t px-1 pt-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="border-border bg-card rounded-[2.5rem] border p-12 text-center">
            <Filter className="text-muted-foreground/50 mx-auto size-12" />
            <h3 className="mt-4 text-lg font-medium">
              {normalizedSearchQuery
                ? "Không tìm thấy dịch vụ phù hợp"
                : selectedCategory !== "all"
                  ? `Chưa có dịch vụ trong mục ${selectedCategoryLabel ?? "đã chọn"}`
                  : "Sàn dịch vụ chưa có bài đăng"}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {normalizedSearchQuery
                ? "Thử một từ khóa khác hoặc xóa bộ lọc để xem toàn bộ dịch vụ."
                : selectedCategory !== "all"
                  ? "Danh mục này hiện chưa có dịch vụ đã được LiveHub phê duyệt."
                  : "Các dịch vụ đã được phê duyệt sẽ xuất hiện tại đây."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="border-border bg-background hover:border-accent hover:text-accent mt-5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const tier = service.provider?.membership_tier;
              const isVip = tier === "premium" || tier === "standard";
              const cardClasses = getTierCardStyle(tier);

              return (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className={`group relative flex flex-col rounded-3xl border p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardClasses}`}
                >
                  {/* Image Aspect Box with inner rounded corners and subtle padding */}
                  <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                    {service.images && service.images.length > 0 ? (
                      <Image
                        src={service.images[0]!}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
                        Chưa có hình ảnh
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                      {service.category === "equipment"
                        ? "Thiết bị"
                        : service.category === "studio"
                          ? "Studio"
                          : service.category === "crew"
                            ? "Ekip"
                            : "Operator"}
                    </div>

                    {service.images && service.images.length > 1 && (
                      <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                        <Images className="size-3" />
                        <span>+{service.images.length - 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-3 pt-3.5">
                    {/* VIP Ribbon / Badge */}
                    {isVip && (
                      <div className="mb-2">
                        <GoldenTicketBadge
                          tier={tier}
                          variant="badge"
                          showSla={tier === "premium"}
                        />
                      </div>
                    )}

                    <h3 className="group-hover:text-accent line-clamp-1 text-base font-semibold transition-colors">
                      {service.title}
                    </h3>

                    <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs leading-relaxed">
                      {service.description}
                    </p>

                    <div className="flex-1 pb-3">
                      {service.provider?.full_name && (
                        <p className="mt-2.5 text-[11px] text-muted-foreground truncate">
                          Bởi: <strong className="text-foreground">{service.provider.full_name}</strong>
                        </p>
                      )}
                    </div>

                    <div className="border-border/60 -mx-3.5 -mb-3.5 mt-auto flex items-center justify-between border-t px-4 py-3.5 bg-muted/20 rounded-b-3xl">
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-medium">
                          Giá thuê
                        </span>
                        <p className="text-accent text-sm font-bold">
                          {Number(service.price_per_day).toLocaleString("vi-VN")}{" "}
                          đ
                          <span className="text-muted-foreground text-[11px] font-normal">
                            /ngày
                          </span>
                        </p>
                      </div>

                      <span className="border-border text-foreground group-hover:bg-accent group-hover:border-accent flex size-8 items-center justify-center rounded-full border transition-all group-hover:text-white shadow-xs">
                        <ArrowUpRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background min-h-screen px-6 pt-28">
          <div className="mx-auto max-w-6xl space-y-6">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-md" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-3xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
