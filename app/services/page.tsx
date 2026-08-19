"use client";

import { GoldenTicketBadge, getTierPriorityWeight, getTierCardStyle } from "@/components/golden-ticket-badge";
import { AuroraText } from "@/components/ui/aurora-text";
import { Skeleton } from "@/components/ui/skeleton";
import { UnauthenticatedBlurOverlay } from "@/components/unauthenticated-blur-overlay";
import { loginWithGoogle } from "@/lib/auth-client";
import { DEMO_PROFILES, getActiveDemoRole } from "@/lib/demo-session";
import { SEED_SERVICES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Service, ServiceCategory } from "@/lib/types/database";
import { getDemandImages } from "@/lib/demand-helpers";
import { SafeImage } from "@/components/ui/safe-image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Briefcase, Crown, Filter, Images, MapPin, Plus, Search, Sparkles, Zap } from "lucide-react";
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
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [recommendedDemands, setRecommendedDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; email: string } | null>(() => {
    if (typeof window !== "undefined") {
      const demoRole = getActiveDemoRole();
      const demoProfile = DEMO_PROFILES[demoRole];
      if (demoProfile) {
        return { id: demoProfile.id, role: demoProfile.role, email: demoProfile.email };
      }
    }
    return null;
  });

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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;

        let userRole = "customer";
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          userRole = profile?.role || "customer";
          if (isCurrentRequest) {
            setCurrentUser({ id: user.id, role: userRole, email: user.email || "" });
          }

          // If supplier, fetch their own services & recommended customer demands
          if (userRole === "provider") {
            const { data: ownData } = await supabase
              .from("services")
              .select("*, provider:profiles(*)")
              .eq("provider_id", user.id)
              .order("created_at", { ascending: false });

            const { data: demandsData } = await supabase
              .from("demands")
              .select("*, customer:profiles(*)")
              .eq("status", "approved")
              .order("created_at", { ascending: false })
              .limit(6);

            if (isCurrentRequest) {
              setMyServices((ownData ?? []) as Service[]);
              setRecommendedDemands(demandsData ?? []);
            }
          }
        }

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

  // For unauthenticated guests, limit the displayed services to top 3 demo items to keep page concise & focused
  const displayedServices = useMemo(() => {
    if (currentUser) return filteredServices;
    return filteredServices.slice(0, 3);
  }, [currentUser, filteredServices]);

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
    <div className="bg-background text-foreground min-h-screen relative">
      {/* 1. THE ENTIRE PAGE - Blurred & unclickable for unauthenticated guests */}
      <div
        className={
          !currentUser
            ? "pointer-events-none select-none filter blur-[4px] opacity-70 transition-all"
            : ""
        }
        aria-hidden={!currentUser}
      >
        {/* Header Banner */}
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                    <Zap className="size-3 text-amber-500 fill-amber-500" />
                    <span>Đối tác Golden Ticket VIP & Standard Partner</span>
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

              <div className="flex shrink-0 items-center gap-3 flex-wrap">
                {currentUser?.role === "provider" ? (
                  <>
                    <Link
                      href="/demands"
                      className="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors"
                    >
                      Duyệt dự án khách hàng →
                    </Link>
                    <Link
                      href="/services/my"
                      className="border-border bg-background hover:bg-muted rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                    >
                      Dịch vụ của tôi
                    </Link>
                    <Link
                      href="/services/new"
                      className="bg-orange-500 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Đăng dịch vụ</span>
                    </Link>
                  </>
                ) : currentUser ? (
                  <>
                    <Link
                      href="/demands/my"
                      className="border-border bg-background hover:bg-muted rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                    >
                      Nhu cầu của tôi
                    </Link>
                    <Link
                      href="/demands/new"
                      className="bg-orange-500 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Đăng nhu cầu tìm ekip</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => loginWithGoogle("/demands/new")}
                      className="bg-orange-500 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Đăng nhu cầu tìm ekip</span>
                    </button>
                  </>
                )}
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
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                  vipOnly
                    ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400 font-extrabold"
                    : "border border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                }`}
              >
                <Crown
                  className={`size-3.5 ${
                    vipOnly
                      ? "text-neutral-950 fill-neutral-950"
                      : "text-amber-500 fill-amber-500"
                  }`}
                />
                <span>Golden VIP</span>
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

        {/* 1. SUPPLIER WORKSPACE MODE (When user is a Provider) */}
        {!loading && currentUser?.role === "provider" ? (
          <div className="space-y-12">
            {/* Supplier Role Explanatory Banner */}
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Briefcase className="size-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Không gian dành riêng cho Nhà cung cấp (Supplier)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Quản lý dịch vụ của bạn & Tìm kiếm Nhu cầu dự án
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Để bảo vệ quyền lợi và bảo mật bảng giá giữa các đối tác, Nhà cung cấp sẽ quản lý các gói thiết bị/studio của mình tại đây và chuyển sang <strong>Sàn Nhu Cầu</strong> để nộp hồ sơ ứng tuyển dự án trực tiếp tới khách hàng.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/demands"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors"
                >
                  <span>Khám phá Sàn Nhu Cầu Dự Án</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/services/new"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="size-4 text-orange-500" />
                  <span>Đăng dịch vụ mới</span>
                </Link>
              </div>
            </div>

            {/* Section: Supplier's Own Services */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Dịch vụ bạn đang cung cấp ({myServices.length})</h3>
                  <p className="text-xs text-muted-foreground">Theo dõi và chỉnh sửa thiết bị, studio bạn đang cho thuê</p>
                </div>
                <Link href="/services/new" className="text-xs font-bold text-orange-500 hover:underline">
                  + Thêm dịch vụ
                </Link>
              </div>

              {myServices.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border p-10 text-center space-y-3">
                  <p className="text-sm font-semibold text-foreground">Bạn chưa đăng tải dịch vụ nào</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Hãy đăng các gói thiết bị máy quay 4K, phòng livestream hoặc nhân sự kỹ thuật để tiếp cận khách hàng.
                  </p>
                  <Link
                    href="/services/new"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="size-4" />
                    <span>Đăng dịch vụ đầu tiên</span>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {myServices.map((service) => (
                    <div
                      key={service.id}
                      className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md"
                    >
                      <div>
                        <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                          <SafeImage
                            src={service.images?.[0] || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80"}
                            alt={service.title}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                            {service.category}
                          </span>
                          <span className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            service.status === "approved"
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-black"
                          }`}>
                            {service.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-3">
                          <h4 className="font-bold text-sm text-foreground line-clamp-1">{service.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                        </div>
                      </div>

                      <div className="border-border/60 -mx-3.5 -mb-3.5 mt-3 flex items-center justify-between border-t px-3.5 py-3 bg-muted/20 rounded-b-3xl">
                        <p className="text-sm font-bold text-orange-600">
                          {Number(service.price_per_day).toLocaleString("vi-VN")} đ/ngày
                        </p>
                        <Link
                          href={`/services/${service.id}`}
                          className="text-xs font-bold text-foreground hover:text-orange-500"
                        >
                          Xem chi tiết →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Recommended Demands for Supplier */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-orange-500" />
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Gợi ý Nhu cầu dự án phù hợp với bạn</h3>
                    <p className="text-xs text-muted-foreground">Khách hàng đang tìm kiếm nhà cung cấp cho các buổi livestream sắp tới</p>
                  </div>
                </div>
                <Link href="/demands" className="text-xs font-bold text-orange-500 hover:underline">
                  Xem tất cả ({recommendedDemands.length}) →
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedDemands.slice(0, 3).map((demand) => {
                  const dImages = getDemandImages(demand);
                  return (
                    <Link
                      key={demand.id}
                      href={`/demands/${demand.id}`}
                      className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-600">
                            Đang mở ứng tuyển
                          </span>
                          <span className="text-[11px] text-muted-foreground">{demand.location}</span>
                        </div>

                        {/* Image Banner */}
                        <div className="relative mb-3 h-32 w-full overflow-hidden rounded-2xl bg-muted">
                          <SafeImage
                            src={dImages[0]!}
                            alt={demand.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-orange-500 transition-colors">
                          {demand.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{demand.description}</p>
                      </div>

                      <div className="border-border/60 -mx-5 -mb-5 flex items-center justify-between border-t px-5 py-3.5 bg-muted/20 rounded-b-3xl">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Ngân sách</span>
                          <p className="text-sm font-bold text-orange-600">
                            {Number(demand.budget).toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                        <span className="rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white group-hover:bg-orange-600 transition-colors">
                          Báo giá ngay
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : loading ? (
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
            {displayedServices.map((service) => {
              const tier = service.provider?.membership_tier;
              const isVip = tier === "premium" || tier === "standard";
              const cardClasses = getTierCardStyle(tier);

              return (
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
                  className={`group relative flex flex-col rounded-3xl border p-3.5 shadow-sm transition-all duration-300 ${
                    currentUser ? "hover:-translate-y-1 hover:shadow-xl" : ""
                  } ${cardClasses}`}
                >
                  {/* Image Aspect Box with inner rounded corners and subtle padding */}
                  <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                    <SafeImage
                      src={service.images?.[0] || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80"}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Top Badges Bar on Image */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-lg bg-black/75 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs uppercase tracking-wider whitespace-nowrap shrink-0">
                          {service.category === "equipment"
                            ? "Thiết bị"
                            : service.category === "studio"
                              ? "Studio"
                              : service.category === "crew"
                                ? "Ekip"
                                : "Operator"}
                        </span>
                        {isVip && (
                          <GoldenTicketBadge
                            tier={tier}
                            variant="admin-tag"
                          />
                        )}
                      </div>

                      {service.images && service.images.length > 1 && (
                        <div className="inline-flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          <Images className="size-3" />
                          <span>+{service.images.length - 1} ảnh</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-2.5 pt-3.5 space-y-2">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-orange-500">
                      {service.title}
                    </h3>

                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>

                    <div className="mt-auto pt-2 space-y-2">
                      {service.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <MapPin className="size-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">{service.location}</span>
                        </div>
                      )}

                      {service.provider?.full_name && (
                        <div className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                          <span className="truncate">
                            Nhà cung cấp: <strong className="text-foreground">{service.provider.full_name}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-border/60 -mx-3.5 -mb-3.5 mt-3 flex items-center justify-between border-t px-4 py-3 bg-muted/20 rounded-b-3xl">
                    <div>
                      <span className="text-[10px] block font-medium text-muted-foreground">
                        Giá thuê
                      </span>
                      <p className="text-base font-extrabold text-orange-600">
                        {Number(service.price_per_day).toLocaleString("vi-VN")} đ
                        <span className="text-[11px] font-normal text-muted-foreground">/ngày</span>
                      </p>
                    </div>

                    <span className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-all group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-white shadow-xs">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Inline Guest Banner at bottom of page (No intrusive full-screen flash) */}
        {!currentUser && !loading && (
          <div className="mt-14">
            <UnauthenticatedBlurOverlay
              title="Mở khóa 100+ Thiết bị & Studio Chuyên Nghiệp"
              description="Đăng nhập để xem đầy đủ báo giá, thông tin liên hệ nhà cung cấp và đặt lịch thuê thiết bị, studio livestream ngay."
              loginUrl="/services"
              badgeText="Mở khóa Bảng giá & Nhà cung cấp"
            />
          </div>
        )}
      </main>
      </div>
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
