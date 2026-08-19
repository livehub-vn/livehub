"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface UnauthenticatedBlurOverlayProps {
  title?: string;
  description?: string;
  loginUrl?: string;
  badgeText?: string;
}

export function UnauthenticatedBlurOverlay({
  title = "Đăng nhập để xem hơn 100+ dịch vụ & Báo giá",
  description = "Tạo tài khoản hoặc đăng nhập để mở khóa toàn bộ danh sách dịch vụ, xem thông tin liên hệ nhà cung cấp và đặt lịch thuê thiết bị, studio livestream.",
  loginUrl = "/login",
  badgeText = "Mở khóa toàn bộ dữ liệu & Báo giá",
}: UnauthenticatedBlurOverlayProps): ReactNode {
  return (
    <div className="relative w-full my-8">
      {/* Floating Center CTA Card */}
      <div className="relative z-20 mx-auto max-w-xl px-4 text-center">
        <div className="rounded-[2.5rem] border border-orange-500/40 bg-card/95 p-8 shadow-2xl backdrop-blur-2xl sm:p-10 text-foreground ring-1 ring-orange-500/20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 mb-4 shadow-xs">
            <Sparkles className="size-4 text-orange-500" />
            <span>{badgeText}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            <AuroraText>{title}</AuroraText>
          </h3>

          <p className="mt-3.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          <div className="mt-7 flex items-center justify-center">
            <Link
              href={loginUrl}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-600 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>Gia nhập LiveHub</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
