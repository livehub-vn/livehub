"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface UnauthenticatedBlurOverlayProps {
  title?: string;
  description?: string;
  loginUrl?: string;
  registerUrl?: string;
  badgeText?: string;
}

export function UnauthenticatedBlurOverlay({
  title = "Đăng nhập để khám phá toàn bộ sàn giao dịch",
  description = "Tạo tài khoản miễn phí trong 30 giây để xem hơn 100+ dịch vụ thiết bị chuyên nghiệp, ứng tuyển dự án và kết nối trực tiếp với đối tác.",
  loginUrl = "/login",
  registerUrl = "/login",
  badgeText = "⚡ Mở khóa toàn bộ dữ liệu & Báo giá",
}: UnauthenticatedBlurOverlayProps): ReactNode {
  return (
    <div className="relative -mt-32 pt-32 pb-16">
      {/* Progressive Blur Gradient Layers */}
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-background/70 to-background backdrop-blur-md"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 30%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 30%, black 100%)",
        }}
        aria-hidden="true"
      />

      {/* Floating Center CTA Card */}
      <div className="relative z-20 mx-auto max-w-xl px-4 text-center">
        <div className="rounded-[2.5rem] border border-orange-500/30 bg-card/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10 text-foreground ring-1 ring-orange-500/20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400 mb-4 shadow-xs">
            <Sparkles className="size-3.5" />
            <span>{badgeText}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            <AuroraText>{title}</AuroraText>
          </h3>

          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={loginUrl}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:scale-[1.02]"
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href={registerUrl}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 px-6 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              <Lock className="size-3.5 text-muted-foreground" />
              <span>Đăng ký tài khoản mới</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
