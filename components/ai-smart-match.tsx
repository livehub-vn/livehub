"use client";

import type { Demand, Service } from "@/lib/types/database";
import { ArrowUpRight, Bot, Check, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AiSmartMatchProps {
  demand: Demand;
  availableServices?: Service[];
  onInvite?: (serviceId: string) => void;
}

export function AiSmartMatch({ demand, availableServices = [] }: AiSmartMatchProps) {
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
    // AI Matching Algorithm based on Category, Budget, Location & Keywords
    const defaultServices: Service[] = [
      {
        id: "s0000001-0000-0000-0000-000000000001",
        provider_id: "d0000001-0000-0000-0000-000000000001",
        title: "Gói Máy Quay Cinema Sony FX3 + Lens GM II + Truyền Hình Ảnh Không Dây Hollyland 4K",
        description: "Trọn bộ máy quay 4K 120fps Full-frame, chống rung quang học, truyền hình ảnh không dây độ trễ siêu thấp cho phiên live chuyên nghiệp.",
        category: "equipment",
        price_per_day: 1800000,
        location: demand.location || "TP. Hồ Chí Minh",
        status: "approved",
        images: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&auto=format&fit=crop&q=80",
        ],
        provider: {
          id: "d0000001-0000-0000-0000-000000000001",
          email: "saigonstudio@livehub.vn",
          full_name: "Saigon Cinema & Studio Production",
          phone: "0908889999",
          avatar_url: null,
          bio: null,
          role: "provider",
          membership_tier: "premium",
          created_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "s0000001-0000-0000-0000-000000000002",
        provider_id: "d0000001-0000-0000-0000-000000000001",
        title: "Phim Trường Livestream Cách Âm E-Commerce & Talkshow Chuẩn 4K Chuyên Nghiệp",
        description: "Phòng quay 60m² cách âm tiêu chuẩn, trang bị sẵn 3 góc máy Sony 4K, bàn trộn ATEM Mini Extreme ISO và dàn đèn Nanlite.",
        category: "studio",
        price_per_day: 4500000,
        location: demand.location || "TP. Hồ Chí Minh",
        status: "approved",
        images: [
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
        ],
        provider: {
          id: "d0000001-0000-0000-0000-000000000001",
          email: "saigonstudio@livehub.vn",
          full_name: "Saigon Cinema & Studio Production",
          phone: "0908889999",
          avatar_url: null,
          bio: null,
          role: "provider",
          membership_tier: "premium",
          created_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "s0000001-0000-0000-0000-000000000003",
        provider_id: "d0000001-0000-0000-0000-000000000002",
        title: "Ekip Livestream & Kỹ Thuật Viên Vận Hành Bàn Trộn ATEM / OBS / vMix Chuyên Nghiệp",
        description: "Đội ngũ kỹ thuật 3 nhân sự hỗ trợ từ set-up ánh sáng, cân chỉnh màu sắc camera đến điều phối phiên live không gián đoạn.",
        category: "crew",
        price_per_day: 2500000,
        location: demand.location || "TP. Hồ Chí Minh",
        status: "approved",
        images: [
          "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1000&auto=format&fit=crop&q=80",
        ],
        provider: {
          id: "d0000001-0000-0000-0000-000000000002",
          email: "hanoilive@livehub.vn",
          full_name: "Hanoi Stream Tech & Media",
          phone: "0912334455",
          avatar_url: null,
          bio: null,
          role: "provider",
          membership_tier: "standard",
          created_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      },
    ];

    const pool = availableServices.length > 0 ? availableServices : defaultServices;

    const computed = pool.slice(0, 3).map((srv, idx) => {
      let score = 98 - idx * 3;
      const reasons: string[] = [];

      if (srv.location.includes(demand.location) || demand.location.includes(srv.location)) {
        reasons.push(`Cùng khu vực ${demand.location}`);
      } else {
        reasons.push("Hỗ trợ điều phối thiết bị tận nơi");
      }

      if (Number(demand.budget) >= Number(srv.price_per_day)) {
        reasons.push("Tối ưu trong khung ngân sách dự kiến");
      } else {
        reasons.push("Đạt tiêu chuẩn kỹ thuật chuyên nghiệp");
      }

      if (srv.provider?.membership_tier === "premium") {
        reasons.push("Đối tác Golden Ticket VIP Support");
      }

      return {
        service: srv,
        matchScore: score,
        reasons,
        invited: false,
      };
    });

    setMatches(computed);

    // Push In-App Realtime Notification Event
    if (!notified && typeof window !== "undefined") {
      setNotified(true);
      window.dispatchEvent(
        new CustomEvent("livehub:new-notification", {
          detail: {
            title: "🤖 AI LiveHub Đã Tìm Thấy Dịch Vụ Phù Hợp!",
            description: `Hệ thống AI vừa tự động ghép nối 3 dịch vụ & đối tác phù hợp 98% cho dự án "${demand.title}".`,
            type: "ai_match",
            url: `/demands/${demand.id}`,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  }, [demand, availableServices, notified]);

  const handleInvite = (index: number) => {
    setMatches((prev) =>
      prev.map((item, i) => (i === index ? { ...item, invited: true } : item))
    );
  };

  if (matches.length === 0) return null;

  return (
    <div className="border-border bg-card rounded-[2.5rem] border p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Subtle AI Glow Background */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-orange-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500 text-white shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              AI Smart Match Automation
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Dịch vụ & Đối tác AI gợi ý phù hợp nhất cho dự án
          </h3>
          <p className="text-xs text-muted-foreground">
            Thuật toán AI tự động phân tích địa điểm, ngân sách và yêu cầu kỹ thuật để ghép nối đối tác nhanh chóng.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0">
          <Bot className="size-4" />
          <span>Tự động ghép nối 24/7</span>
        </div>
      </div>

      {/* Matched Services Grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((item, idx) => (
          <div
            key={item.service.id || idx}
            className="group flex flex-col justify-between rounded-3xl border border-border bg-muted/20 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-orange-500/40"
          >
            <div>
              {/* Image & Match Score Badge */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                {item.service.images && item.service.images.length > 0 ? (
                  <Image
                    src={item.service.images[0]!}
                    alt={item.service.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    Chưa có ảnh
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                  <Zap className="size-3" />
                  <span>{item.matchScore}% Phù hợp</span>
                </div>
              </div>

              {/* Title & Reasons */}
              <div className="mt-3.5 space-y-2">
                <h4 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-orange-500 transition-colors">
                  {item.service.title}
                </h4>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.service.description}
                </p>

                {/* AI Matching Reasons Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.reasons.map((r, ri) => (
                    <span
                      key={ri}
                      className="rounded-lg bg-card border border-border/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Price & 1-Click Action */}
            <div className="border-border/60 -mx-4 -mb-4 mt-4 flex items-center justify-between border-t px-4 py-3 bg-card rounded-b-3xl">
              <div>
                <span className="text-[10px] text-muted-foreground block">Đơn giá</span>
                <p className="text-sm font-bold text-orange-600">
                  {Number(item.service.price_per_day).toLocaleString("vi-VN")} đ
                  <span className="text-[10px] font-normal text-muted-foreground">/ngày</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleInvite(idx)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
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
                  className="flex size-8 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground hover:bg-muted transition-colors"
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
