"use client";

import { GoldenTicketBadge, getTierPriorityWeight, getTierCardStyle } from "@/components/golden-ticket-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AuroraText } from "@/components/ui/aurora-text";
import { loginWithGoogle } from "@/lib/auth-client";
import { getDemandImages } from "@/lib/demand-helpers";
import { SEED_DEMANDS } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Demand } from "@/lib/types/database";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Crown,
  Images,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function DemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [myDemands, setMyDemands] = useState<Demand[]>([]);
  const [recommendedServices, setRecommendedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVipOnly, setFilterVipOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; email: string } | null>(null);

  useEffect(() => {
    async function fetchDemands() {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let userRole = "customer";
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          userRole = profile?.role || "customer";
          setCurrentUser({ id: user.id, role: userRole, email: user.email || "" });

          // If buyer, fetch their own demands & recommended supplier services
          if (userRole === "customer") {
            const { data: ownDemands } = await supabase
              .from("demands")
              .select("*, customer:profiles(*)")
              .eq("customer_id", user.id)
              .order("created_at", { ascending: false });

            const { data: servicesData } = await supabase
              .from("services")
              .select("*, provider:profiles(*)")
              .eq("status", "approved")
              .order("created_at", { ascending: false })
              .limit(6);

            setMyDemands((ownDemands ?? []) as Demand[]);
            setRecommendedServices(servicesData ?? []);
          }
        }

        const { data, error } = await supabase
          .from("demands")
          .select("*, customer:profiles(*)")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (data && data.length > 0 && !error) {
          setDemands(data as Demand[]);
        } else {
          setDemands(SEED_DEMANDS);
        }
      } catch {
        setDemands(SEED_DEMANDS);
      }
      setLoading(false);
    }

    fetchDemands();
  }, []);

  // Filter & priority sort: Premium (Golden VIP) > Standard > Basic > Free Trial
  const processedDemands = useMemo(() => {
    let list = demands.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterVipOnly) {
        const tier = d.customer?.membership_tier;
        return tier === "premium" || tier === "standard";
      }

      return true;
    });

    return list.sort((a, b) => {
      const weightA = getTierPriorityWeight(a.customer?.membership_tier);
      const weightB = getTierPriorityWeight(b.customer?.membership_tier);
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [demands, searchQuery, filterVipOnly]);

  // For unauthenticated guests, limit the displayed demands to top 4 demo items to keep page concise
  const displayedDemands = useMemo(() => {
    if (currentUser) return processedDemands;
    return processedDemands.slice(0, 4);
  }, [currentUser, processedDemands]);

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
        <header className="border-b border-border bg-card/60 px-4 pt-28 pb-10 backdrop-blur-sm xl:px-0 sm:pt-32">
          <div className="mx-auto w-full max-w-6xl">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              <span>Trở về Trang chủ</span>
            </Link>

            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                    <Zap className="size-3 text-amber-500 fill-amber-500" />
                    <span>Ưu tiên dự án Golden Ticket VIP & Standard</span>
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Sàn nhu cầu dự án <AuroraText>LiveHub</AuroraText>
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Tổng hợp yêu cầu tuyển chọn ekip, thuê thiết bị & dự án livestream từ các thương hiệu hàng đầu.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {currentUser ? (
                  <>
                    <Link
                      href="/demands/my"
                      className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-muted"
                    >
                      Nhu cầu của tôi
                    </Link>
                    <Link
                      href="/demands/new"
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600"
                    >
                      <Plus className="size-4" />
                      <span>Đăng nhu cầu mới</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => loginWithGoogle("/demands/my")}
                      className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-muted cursor-pointer"
                    >
                      Nhu cầu của tôi
                    </button>
                    <button
                      type="button"
                      onClick={() => loginWithGoogle("/demands/new")}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Đăng nhu cầu mới</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search & VIP Filter Controls */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhu cầu theo tiêu đề, địa điểm..."
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-11 pr-4 text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterVipOnly(false)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    !filterVipOnly
                      ? "bg-accent text-white shadow-sm"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Tất cả nhu cầu
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVipOnly(!filterVipOnly)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                    filterVipOnly
                      ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400 font-extrabold"
                      : "border border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                  }`}
                >
                  <Crown
                    className={`size-3.5 ${
                      filterVipOnly
                        ? "text-neutral-950 fill-neutral-950"
                        : "text-amber-500 fill-amber-500"
                    }`}
                  />
                  <span>Golden VIP & Standard</span>
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Demands Grid */}
      <main className="mx-auto w-full max-w-6xl px-4 xl:px-0 py-10">
        {/* 1. BUYER WORKSPACE MODE (When user is a Customer) */}
        {!loading && currentUser?.role === "customer" ? (
          <div className="space-y-12">
            {/* Buyer Role Explanatory Banner */}
            <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Users className="size-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Không gian Quản lý Nhu cầu của Khách hàng (Buyer)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Quản lý bài đăng tuyển của bạn & Xem gợi ý Nhà cung cấp
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Để bảo vệ quyền riêng tư của các dự án, Khách hàng quản lý các yêu cầu tuyển chọn của mình tại đây và có thể chuyển sang <strong>Sàn Dịch Vụ</strong> để thuê trực tiếp máy quay, studio hoặc nhân sự livestream có sẵn.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors"
                >
                  <span>Khám phá Sàn Dịch Vụ Livestream</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/demands/new"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="size-4 text-orange-500" />
                  <span>Đăng nhu cầu mới</span>
                </Link>
              </div>
            </div>

            {/* Section: Buyer's Own Demands */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Nhu cầu dự án của bạn ({myDemands.length})</h3>
                  <p className="text-xs text-muted-foreground">Theo dõi tiến trình nhận báo giá và tuyển chọn đối tác</p>
                </div>
                <Link href="/demands/new" className="text-xs font-bold text-orange-500 hover:underline">
                  + Tạo nhu cầu mới
                </Link>
              </div>

              {myDemands.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border p-10 text-center space-y-3">
                  <p className="text-sm font-semibold text-foreground">Bạn chưa có bài đăng nhu cầu nào</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Hãy tạo bài đăng nhu cầu để các ekip và nhà cung cấp hàng đầu gửi báo giá cạnh tranh cho bạn.
                  </p>
                  <Link
                    href="/demands/new"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="size-4" />
                    <span>Tạo nhu cầu đầu tiên</span>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {myDemands.map((demand) => (
                    <Link
                      key={demand.id}
                      href={`/demands/${demand.id}`}
                      className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            demand.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {demand.status === "approved" ? "Đang mở ứng tuyển" : "Đang chờ duyệt"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{demand.location}</span>
                        </div>

                        <h4 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-orange-500 transition-colors">
                          {demand.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{demand.description}</p>
                      </div>

                      <div className="border-t border-border/70 pt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Ngân sách dự kiến</span>
                          <p className="text-base font-bold text-orange-600">
                            {Number(demand.budget).toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                        <span className="text-xs font-bold text-foreground group-hover:text-orange-500">
                          Xem chi tiết & Báo giá →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Recommended Services for Buyer */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-orange-500" />
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Gợi ý Nhà cung cấp & Thiết bị có sẵn</h3>
                    <p className="text-xs text-muted-foreground">Các dịch vụ đã được LiveHub kiểm duyệt sẵn sàng phục vụ</p>
                  </div>
                </div>
                <Link href="/services" className="text-xs font-bold text-orange-500 hover:underline">
                  Xem tất cả ({recommendedServices.length}) →
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedServices.slice(0, 3).map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${service.id}`}
                    className="group relative flex flex-col rounded-3xl border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl"
                  >
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
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        {service.category}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-orange-500 transition-colors">
                        {service.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <p className="text-sm font-bold text-orange-600">
                          {Number(service.price_per_day).toLocaleString("vi-VN")} đ/ngày
                        </p>
                        <span className="rounded-xl bg-orange-500 px-3 py-1 text-xs font-bold text-white group-hover:bg-orange-600 transition-colors">
                          Thuê ngay
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-4/5 rounded-md" />
                </div>

                <div className="border-t border-border/60 pt-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : processedDemands.length === 0 ? (
          <div className="rounded-[2.5rem] border border-border bg-card p-12 text-center">
            <h3 className="text-lg font-medium">Chưa có nhu cầu dự án nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Thử tìm kiếm từ khóa khác hoặc đăng nhu cầu mới.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {displayedDemands.map((demand) => {
              const tier = demand.customer?.membership_tier;
              const isVip = tier === "premium" || tier === "standard";
              const cardClasses = getTierCardStyle(tier);

              return (
                <Link
                  key={demand.id}
                  href={currentUser ? `/demands/${demand.id}` : "#"}
                  onClick={(e) => {
                    if (!currentUser) {
                      e.preventDefault();
                      loginWithGoogle(`/demands/${demand.id}`);
                    }
                  }}
                  tabIndex={!currentUser ? -1 : 0}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-300 ${
                    currentUser ? "hover:shadow-xl hover:-translate-y-1" : ""
                  } ${cardClasses}`}
                >
                  <div>
                    {/* Top Row: Tag, VIP Badge & Date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-500">
                          Dự án cần ekip
                        </span>
                        {isVip && (
                          <GoldenTicketBadge
                            tier={tier}
                            variant="badge"
                            showSla={tier === "premium"}
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(demand.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {/* Image Preview Banner if available */}
                    {(() => {
                      const dImages = getDemandImages(demand);
                      if (dImages.length === 0) return null;
                      return (
                        <div className="relative mt-3.5 h-36 w-full overflow-hidden rounded-2xl bg-muted">
                          <Image
                            src={dImages[0]!}
                            alt={demand.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {dImages.length > 1 && (
                            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                              <Images className="size-3" />
                              <span>+{dImages.length - 1} ảnh</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <h3 className="mt-3.5 text-base font-semibold leading-snug transition-colors group-hover:text-accent">
                      {demand.title}
                    </h3>

                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {demand.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-accent" />
                        {demand.location}
                      </span>
                      {demand.event_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-amber-500" />
                          Ngày diễn ra: {demand.event_date}
                        </span>
                      )}
                    </div>

                    <div className="pb-3">
                      {demand.customer?.full_name && (
                        <p className="mt-3 text-[11px] text-muted-foreground">
                          Người đăng: <strong className="text-foreground">{demand.customer.full_name}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-border/60 -mx-5 -mb-5 mt-auto flex items-center justify-between border-t px-5 py-3.5 bg-muted/20 rounded-b-3xl">
                    <div>
                      <span className="text-[10px] block font-medium text-muted-foreground">Ngân sách dự kiến</span>
                      <p className="text-base font-bold text-accent">
                        {Number(demand.budget).toLocaleString("vi-VN")} đ
                      </p>
                    </div>

                    <span className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-all group-hover:bg-accent group-hover:border-accent group-hover:text-white shadow-xs">
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      </div>

      {/* 2. FULL-SCREEN CENTERED LOCK OVERLAY FOR GUESTS */}
      {!currentUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/35 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-[2.5rem] border border-orange-500/40 bg-card/95 p-8 shadow-2xl backdrop-blur-2xl sm:p-10 text-center ring-1 ring-orange-500/20 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 mb-4 shadow-xs">
              <Sparkles className="size-4 text-orange-500" />
              <span>Mở khóa Dự án & Cơ hội Nhận việc</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              <AuroraText>Mở khóa 100+ Dự án Livestream Đang Cần Ekip</AuroraText>
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Đăng nhập để nhận thông tin liên hệ trực tiếp từ thương hiệu và gửi báo giá chốt show ngay hôm nay.
            </p>

            <div className="mt-6 flex items-center justify-center">
              <button
                type="button"
                onClick={() => loginWithGoogle("/demands")}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-600 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
              >
                <span>Gia nhập LiveHub miễn phí</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
