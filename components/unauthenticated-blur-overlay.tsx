"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { loginWithGoogle } from "@/lib/auth-client";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

interface UnauthenticatedBlurOverlayProps {
  title?: string;
  description?: string;
  loginUrl?: string;
}

export function UnauthenticatedBlurOverlay({
  title = "Mở khóa 100+ Thiết bị & Dự án Livestream",
  description = "Đăng nhập để xem đầy đủ báo giá, thông tin liên hệ nhà cung cấp và nộp báo giá trực tiếp ngay.",
  loginUrl = "/services",
}: UnauthenticatedBlurOverlayProps): ReactNode {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/50 backdrop-blur-md animate-in fade-in duration-300">
      {/* Centered In-Viewport Unlock Card */}
      <div className="relative z-50 mx-auto w-full max-w-lg rounded-[2.5rem] border border-orange-500/40 bg-card/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl text-center ring-1 ring-orange-500/25 animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
          <AuroraText>{title}</AuroraText>
        </h2>

        <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {description}
        </p>

        {/* Value props badges */}
        <div className="my-5 grid grid-cols-1 gap-2 text-left sm:grid-cols-2 max-w-md mx-auto text-xs text-foreground/80">
          <div className="flex items-center gap-1.5 rounded-xl bg-orange-500/5 border border-orange-500/10 px-3 py-2">
            <CheckCircle2 className="size-3.5 text-orange-500 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">Xem liên hệ trực tiếp</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-orange-500/5 border border-orange-500/10 px-3 py-2">
            <CheckCircle2 className="size-3.5 text-orange-500 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">Báo giá chốt show ngay</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => loginWithGoogle(loginUrl)}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Gia nhập LiveHub miễn phí</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

