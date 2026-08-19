"use client";

import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth";
import { withResolvedMembership } from "@/lib/membership";
import type { Profile } from "@/lib/types/database";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Crown,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function TrialBannerGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkTrialStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setDaysLeft(null);
        setIsExpired(false);
        return;
      }

      if (isAdminEmail(user.email)) {
        setProfile(null);
        setDaysLeft(null);
        setIsExpired(false);
        return;
      }

      // Query profile
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        const userProfile = withResolvedMembership(
          data as Profile,
          user.app_metadata
        );
        setProfile(userProfile);

        // If user already paid for a higher tier, not in trial
        if (userProfile.membership_tier !== "free_trial") {
          setIsExpired(userProfile.membership_status === "expired");
          setDaysLeft(null);
          return;
        }

        // Calculate 60 days from created_at or trial_ends_at
        const createdAtTime = new Date(userProfile.created_at).getTime();
        const trialEndTime = userProfile.trial_ends_at
          ? new Date(userProfile.trial_ends_at).getTime()
          : createdAtTime + 60 * 24 * 60 * 60 * 1000;

        const now = Date.now();
        const diffDays = Math.ceil(
          (trialEndTime - now) / (1000 * 60 * 60 * 24)
        );

        if (diffDays <= 0) {
          setIsExpired(true);
          setDaysLeft(0);
        } else {
          setIsExpired(false);
          setDaysLeft(diffDays);
        }
      }
    }

    checkTrialStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkTrialStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    setIsExpired(false);
  };

  // Exclude auth & pricing paths from locking if user wants to upgrade
  const isAllowedPath =
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login");

  return (
    <>
      {/* 1. REMINDER BANNER FOR 7, 3, 1 DAYS REMAINING */}
      {!bannerDismissed &&
        profile &&
        !isExpired &&
        daysLeft !== null &&
        daysLeft <= 7 && (
          <aside
            aria-label="Thông báo dùng thử"
            className="fixed inset-x-0 top-0 z-9999 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 px-4 py-2 text-xs font-medium text-white shadow-md"
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Clock className="size-3.5" />
                </span>
                <span>
                  Gói dùng thử 02 tháng của bạn còn{" "}
                  <strong className="font-bold underline">
                    {daysLeft === 1 ? "1 ngày duy nhất" : `${daysLeft} ngày`}
                  </strong>
                  . Nâng cấp ngay để duy trì hoạt động không gián đoạn.
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-orange-600 transition-transform hover:scale-105"
                >
                  <Crown className="size-3" />
                  <span>Nâng cấp ngay</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="text-white/80 hover:text-white"
                  title="Đóng thông báo"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </aside>
        )}

      {/* 2. BLOCKING MODAL WHEN 60-DAY TRIAL EXPIRES */}
      {isExpired && !isAllowedPath && (
        <div className="animate-in fade-in fixed inset-0 z-99999 flex items-center justify-center bg-neutral-950/90 p-4 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-orange-500/30 bg-neutral-900 p-8 text-center text-white shadow-2xl sm:p-10">
            {/* Warning Icon Badge */}
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/20 text-orange-400">
              <AlertCircle className="size-8" />
            </div>

            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-400">
              <Sparkles className="size-3" />
              Hết hạn thời gian dùng thử
            </span>

            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Thời gian dùng thử đã kết thúc
            </h2>

            <p className="mt-3 text-xs leading-relaxed text-neutral-300">
              Thời gian <strong>02 tháng dùng thử miễn phí</strong> toàn bộ tính
              năng trên hệ sinh thái LiveHub của bạn đã kết thúc. Vui lòng nâng
              cấp tài khoản lên các gói thành viên chính thức để tiếp tục đăng
              dịch vụ, nhận dự án và thuê thiết bị.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <Link
                href="/pricing"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/35 active:translate-y-0"
              >
                <Crown className="size-4" />
                <span>Nâng cấp gói thành viên ngay</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-950 py-3 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <LogOut className="size-3.5" />
                <span>Thoát & Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
