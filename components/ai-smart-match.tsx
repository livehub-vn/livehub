"use client";

import { GoldenTicketBadge } from "@/components/golden-ticket-badge";
import { SEED_SERVICES } from "@/lib/mock-data";
import type { Demand, Service } from "@/lib/types/database";
import {
  ArrowUpRight,
  Bot,
  Check,
  Phone,
  Sparkles,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AiSmartMatchProps {
  demand: Demand;
  availableServices?: Service[];
  appliedProviderIds?: string[];
  onInvite?: (serviceId: string) => void;
}

export function AiSmartMatch({
  demand,
  availableServices = [],
  appliedProviderIds = [],
}: AiSmartMatchProps) {
  const [matches, setMatches] = useState<
    Array<{
      service: Service;
      matchScore: number;
      reasons: string[];
      invited?: boolean;
    }>
  >([]);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    // 1. Detect demand need category from title & description
    const textToAnalyze = `${demand.title || ""} ${demand.description || ""}`.toLowerCase();
    let preferredCategory: string | null = null;

    if (textToAnalyze.includes("studio") || textToAnalyze.includes("phim trường") || textToAnalyze.includes("phòng quay") || textToAnalyze.includes("phông xanh")) {
      preferredCategory = "studio";
    } else if (textToAnalyze.includes("ekip") || textToAnalyze.includes("đội ngũ") || textToAnalyze.includes("sản xuất") || textToAnalyze.includes("quay phim")) {
      preferredCategory = "crew";
    } else if (textToAnalyze.includes("kỹ thuật") || textToAnalyze.includes("operator") || textToAnalyze.includes("vmix") || textToAnalyze.includes("obs") || textToAnalyze.includes("bàn trộn")) {
      preferredCategory = "operator";
    } else if (textToAnalyze.includes("máy quay") || textToAnalyze.includes("camera") || textToAnalyze.includes("sony") || textToAnalyze.includes("lens") || textToAnalyze.includes("đèn") || textToAnalyze.includes("thiết bị")) {
      preferredCategory = "equipment";
    }

    // 2. Aggregate candidate services pool
    const pool = availableServices.length > 0 ? availableServices : SEED_SERVICES;

    // 3. Filter out services from providers who already applied or are the demand owner
    const candidates = pool.filter(
      (srv) =>
        srv.provider_id !== demand.customer_id &&
        !appliedProviderIds.includes(srv.provider_id)
    );

    // 4. Calculate intelligent match score
    const scored = (candidates.length > 0 ? candidates : pool).map((srv) => {
      let score = 80;
      const reasons: string[] = [];

      // Category relevance match
      if (preferredCategory && srv.category === preferredCategory) {
        score += 12;
        reasons.push("Đúng danh mục & loại hình cần tìm");
      }

      // Location match
      const demandLoc = (demand.location || "").toLowerCase();
      const srvLoc = (srv.location || "").toLowerCase();
      if (
        (demandLoc && srvLoc.includes(demandLoc)) ||
        (srvLoc && demandLoc.includes(srvLoc)) ||
        (demandLoc.includes("hồ chí minh") && srvLoc.includes("hồ chí minh")) ||
        (demandLoc.includes("hà nội") && srvLoc.includes("hà nội"))
      ) {
        score += 5;
        reasons.push("Cùng khu vực hoạt động");
      } else {
        reasons.push("Sẵn sàng điều phối tận nơi");
      }

      // Budget match
      if (Number(demand.budget) > 0 && Number(srv.price_per_day) <= Number(demand.budget)) {
        score += 3;
        reasons.push("Nằm trong khung ngân sách dự kiến");
      }

      // Partner VIP match
      if (srv.provider?.membership_tier === "premium") {
        reasons.push("Đối tác Golden Ticket VIP");
      }

      return {
        service: srv,
        matchScore: Math.min(99, score),
        reasons: reasons.slice(0, 3),
        invited: false,
      };
    });

    // Sort by highest match score
    scored.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scored.slice(0, 3);
    setMatches(topMatches);

    // Trigger in-app notification event once
    if (!notified && typeof window !== "undefined" && topMatches.length > 0) {
      setNotified(true);
      window.dispatchEvent(
        new CustomEvent("livehub:new-notification", {
          detail: {
            title: "LiveHub AI đã gợi ý đối tác phù hợp",
            description: `Hệ thống AI vừa tìm thấy đối tác đáp ứng tốt yêu cầu dự án "${demand.title}".`,
            type: "ai_match",
            url: `/demands/${demand.id}`,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  }, [demand, availableServices, appliedProviderIds, notified]);

  const handleInvite = (index: number) => {
    setMatches((prev) =>
      prev.map((item, i) => (i === index ? { ...item, invited: true } : item))
    );
  };

  if (matches.length === 0) return null;

  return (
    <div className="relative w-full rounded-[2.5rem] border border-orange-500/30 bg-gradient-to-b from-orange-500/[0.04] to-card p-6 sm:p-8 shadow-lg overflow-hidden transition-all duration-300">
      {/* Dynamic Animated Ambient Glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full bg-orange-500/15 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="relative flex size-7 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
              <Sparkles className="size-4 animate-spin [animation-duration:8s]" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-card animate-ping" />
            </div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Gợi ý ghép nối thông minh từ AI
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            Dịch vụ & đối tác phù hợp nhất cho dự án của bạn
          </h3>
          <p className="text-xs text-muted-foreground">
            Hệ thống AI tự động đối chiếu nhu cầu với cơ sở dữ liệu thiết bị, studio và ekip thực tế trên LiveHub.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 px-3.5 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0 self-start sm:self-auto shadow-xs">
          <Bot className="size-4" />
          <span>Tự động đối soát 24/7</span>
        </div>
      </div>

      {/* Recommended Services Grid */}
      <div className="relative mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((item, idx) => (
          <div
            key={item.service.id || idx}
            className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl shadow-xs"
          >
            <div>
              {/* Image & Match Tag */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                {item.service.images && item.service.images.length > 0 ? (
                  <Image
                    src={item.service.images[0]!}
                    alt={item.service.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    Chưa có ảnh
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-orange-500/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                  <Zap className="size-3" />
                  <span>{item.matchScore}% phù hợp</span>
                </div>
              </div>

              {/* Provider Info & Title */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 text-[10px] font-bold">
                      {item.service.provider?.full_name?.[0] || "P"}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground truncate">
                      {item.service.provider?.full_name || "Nhà cung cấp"}
                    </span>
                  </div>
                  {item.service.provider?.membership_tier && (
                    <GoldenTicketBadge
                      tier={item.service.provider.membership_tier}
                      variant="badge"
                    />
                  )}
                </div>

                <h4 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-orange-500 transition-colors">
                  {item.service.title}
                </h4>

                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {item.service.description}
                </p>

                {/* AI Matching Criteria Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.reasons.map((r, ri) => (
                    <span
                      key={ri}
                      className="rounded-lg bg-muted/60 border border-border/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions & Price */}
            <div className="border-border/60 -mx-4 -mb-4 mt-4 flex items-center justify-between border-t px-4 py-3 bg-muted/20 rounded-b-3xl">
              <div>
                <span className="text-[10px] text-muted-foreground block">Đơn giá tham khảo</span>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {Number(item.service.price_per_day).toLocaleString("vi-VN")} đ
                  <span className="text-[10px] font-normal text-muted-foreground">/ngày</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {item.service.provider?.phone && (
                  <a
                    href={`tel:${item.service.provider.phone}`}
                    className="flex size-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-orange-500 hover:bg-muted transition-colors cursor-pointer"
                    title={`Gọi điện: ${item.service.provider.phone}`}
                  >
                    <Phone className="size-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleInvite(idx)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    item.invited
                      ? "bg-emerald-600 text-white"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {item.invited ? (
                    <span className="flex items-center gap-1">
                      <Check className="size-3" />
                      Đã mời
                    </span>
                  ) : (
                    "Mời báo giá"
                  )}
                </button>

                <Link
                  href={`/services/${item.service.id}`}
                  className="flex size-8 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  title="Xem chi tiết dịch vụ"
                >
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
